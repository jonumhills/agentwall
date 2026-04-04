import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })

const FIREWALL_URL = process.env.FIREWALL_URL || 'http://localhost:3001'
const KNOWN_ADDRESS = '0xE8999724879718f1FB6396D16dF7D11fc83BA024'
const EVIL_ADDRESS  = '0x000000000000000000000000000000000000dEaD'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// --- Heartbeat ---
function startHeartbeat(agentId) {
  const beat = async () => {
    try {
      await fetch(`${FIREWALL_URL}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, owsKeyId: process.env.OWS_KEY_ID || null })
      })
      console.log(`[${agentId}] ♥ heartbeat sent`)
    } catch (e) {
      console.error(`[${agentId}] Heartbeat failed:`, e.message)
    }
  }
  beat()
  return setInterval(beat, 60000)
}

// --- Send tx ---
async function sendTx(agentId, { to, value, intent, label }) {
  console.log(`\n[${agentId}] Sending: ${label}`)
  try {
    const res = await fetch(`${FIREWALL_URL}/api/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, chain: 'eip155:11155111', to, value, data: '0x', intent })
    })
    const data = await res.json()
    console.log(`[${agentId}] Result: ${data.approved ? '✅ APPROVED' : '❌ BLOCKED'}`)
    if (!data.approved) {
      data.result?.failedRules?.forEach(r => console.log(`  ✗ ${r.rule}: ${r.reason}`))
    }
    return data
  } catch (e) {
    console.error(`[${agentId}] Request failed:`, e.message)
  }
}

// --- Demo modes ---

async function runNormal() {
  const hb = startHeartbeat('TradingBot-01')
  await delay(1000)
  await sendTx('TradingBot-01', {
    to: KNOWN_ADDRESS, value: '50',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'Normal $50 supplier payment'
  })
  clearInterval(hb)
}

async function runAttack() {
  const hb = startHeartbeat('TradingBot-01')
  await delay(1000)
  await sendTx('TradingBot-01', {
    to: EVIL_ADDRESS, value: '200',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'ATTACK: evil address with legit-sounding intent'
  })
  clearInterval(hb)
}

async function runOverflow() {
  const hb = startHeartbeat('SupportBot-01')
  await delay(1000)
  await sendTx('SupportBot-01', {
    to: KNOWN_ADDRESS, value: '200',
    intent: 'Refund customer overpayment to their wallet',
    label: 'ATTACK: SupportAgent exceeds its $100 cap with $200 tx'
  })
  clearInterval(hb)
}

async function runZombie() {
  console.log('\n[TradingBot-02] Starting with NO heartbeat registered...')
  await sendTx('TradingBot-02', {
    to: KNOWN_ADDRESS, value: '100',
    intent: 'Transfer funds to operations wallet',
    label: 'TradingBot-02 tx with no heartbeat — R3 should BLOCK'
  })
}

async function runDead() {
  const agentId = 'TradingBot-01'
  const hb = startHeartbeat(agentId)
  await delay(1000)
  clearInterval(hb)
  console.log(`\n[${agentId}] Agent is now SILENT — watch dashboard for REVOKED + SWEPT`)
}

async function runMultiAgent() {
  // Reset spend ledger so demo is clean each run
  try {
    await fetch(`${FIREWALL_URL}/reset`, { method: 'POST' })
    console.log('[Demo] Spend ledger reset ✓')
  } catch (e) {
    console.warn('[Demo] Could not reset ledger — firewall may not be running')
  }

  console.log('\n' + '='.repeat(58))
  console.log('  AGENTWALL DEMO — 4 agents, 4 outcomes')
  console.log('  1. PASS   2. Cap block   3. Intent block   4. Revoke')
  console.log('='.repeat(58))

  // ── Agent 1: TradingBot-01 — all 5 rules pass ──────────────
  console.log('\n[1/4] TradingBot-01 — normal $50 payment')
  const hb1 = startHeartbeat('TradingBot-01')
  await delay(1000) // heartbeat must land before tx
  await sendTx('TradingBot-01', {
    to: KNOWN_ADDRESS, value: '50',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'TradingBot-01 $50 (cap $500) — all rules PASS'
  })
  clearInterval(hb1)

  await delay(2000)

  // ── Agent 2: SupportBot-01 — blocked by spend cap (R2) ─────
  console.log('\n[2/4] SupportBot-01 — $200 over $100 spend cap')
  const hb2 = startHeartbeat('SupportBot-01')
  await delay(1000)
  await sendTx('SupportBot-01', {
    to: KNOWN_ADDRESS, value: '200',
    intent: 'Refund customer overpayment to their wallet',
    label: 'SupportBot-01 $200 (cap $100) — R2 BLOCKS'
  })
  clearInterval(hb2)

  await delay(2000)

  // ── Agent 3: AttackAgent — blocked by intent mismatch (R4) ───
  console.log('\n[3/4] AttackAgent — legit intent, burn address → R4 BLOCKS')
  const hb3 = startHeartbeat('AttackBot')
  await delay(1000)
  await sendTx('AttackBot', {
    to: EVIL_ADDRESS, value: '200',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'AttackAgent — intent says supplier, tx goes to burn address'
  })
  clearInterval(hb3)

  await delay(2000)

  // ── Agent 4: PayrollBot-01 — heartbeat then silence → REVOKE
  console.log('\n[4/4] PayrollBot-01 — registers heartbeat then goes silent')
  const hb4 = startHeartbeat('PayrollBot-01')
  await delay(1000) // heartbeat lands
  clearInterval(hb4) // then silence
  console.log('[PayrollBot-01] ☠  Heartbeat stopped — Dead Man\'s Switch armed')
  console.log('[PayrollBot-01]    REVOKED + SWEPT will fire on dashboard in ~5s')
}

// --- CLI entry ---
const mode = process.argv[2] || 'normal'
const modes = { normal: runNormal, attack: runAttack, overflow: runOverflow, multi: runMultiAgent, dead: runDead, zombie: runZombie }

if (!modes[mode]) {
  console.error(`Unknown mode: ${mode}. Use: normal | attack | overflow | multi | dead | zombie`)
  process.exit(1)
}
modes[mode]()
