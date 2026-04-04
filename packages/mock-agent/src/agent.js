import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })

const FIREWALL_URL = process.env.FIREWALL_URL || 'http://localhost:3001'
const KNOWN_ADDRESS = '0xE8999724879718f1FB6396D16dF7D11fc83BA024'
const EVIL_ADDRESS  = '0x000000000000000000000000000000000000dEaD'

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
      body: JSON.stringify({
        agentId,
        chain: 'eip155:11155111',
        to,
        value,
        data: '0x',
        intent
      })
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
  // TradingBot-01: normal $50 payment — all rules pass
  const agentId = 'TradingBot-01'
  const hb = startHeartbeat(agentId)
  await sendTx(agentId, {
    to: KNOWN_ADDRESS,
    value: '50',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'Normal $50 supplier payment'
  })
  clearInterval(hb)
}

async function runAttack() {
  // TradingBot-01: prompt injection — claims known intent but sends to evil address
  const agentId = 'TradingBot-01'
  const hb = startHeartbeat(agentId)
  await sendTx(agentId, {
    to: EVIL_ADDRESS,
    value: '200',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'ATTACK: evil address with legit-sounding intent'
  })
  clearInterval(hb)
}

async function runOverflow() {
  // SupportBot-01: tries to send $200 but its cap is only $100
  const agentId = 'SupportBot-01'
  const hb = startHeartbeat(agentId)
  await sendTx(agentId, {
    to: KNOWN_ADDRESS,
    value: '200',
    intent: 'Refund customer overpayment to their wallet',
    label: 'ATTACK: SupportBot exceeds its $100 cap with $200 tx'
  })
  clearInterval(hb)
}

async function runMultiAgent() {
  // Reset spend ledger so demo is clean each run
  try {
    await fetch(`${FIREWALL_URL}/reset`, { method: 'POST' })
    console.log('[Demo] Spend ledger reset ✓')
  } catch (e) {
    console.warn('[Demo] Could not reset ledger — firewall may not be running')
  }

  console.log('\n' + '='.repeat(55))
  console.log('  MULTI-AGENT DEMO — 3 agents, 1 firewall')
  console.log('='.repeat(55))

  // Wait for heartbeats to register before sending any tx
  await new Promise(r => setTimeout(r, 1500))

  // Bot 1: TradingBot — normal payment, all rules pass
  const hb1 = startHeartbeat('TradingBot-01')
  await new Promise(r => setTimeout(r, 500)) // let heartbeat land first
  await sendTx('TradingBot-01', {
    to: KNOWN_ADDRESS,
    value: '50',
    intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
    label: 'TradingBot $50 (cap: $500) ← should PASS'
  })
  clearInterval(hb1)

  await new Promise(r => setTimeout(r, 800))

  // Bot 2: SupportBot — over its $100 spend cap
  const hb2 = startHeartbeat('SupportBot-01')
  await new Promise(r => setTimeout(r, 500)) // let heartbeat land first
  await sendTx('SupportBot-01', {
    to: KNOWN_ADDRESS,
    value: '200',
    intent: 'Refund customer overpayment to their wallet',
    label: 'SupportBot $200 (cap: $100) ← R2 BLOCKS'
  })
  clearInterval(hb2)

  await new Promise(r => setTimeout(r, 800))

  // Bot 3: PayrollBot — registers heartbeat then goes SILENT → Dead Man's Switch fires
  console.log('\n[PayrollBot-01] Starting up — sending one heartbeat then going silent...')
  const hb3 = startHeartbeat('PayrollBot-01')
  await new Promise(r => setTimeout(r, 1000)) // let heartbeat register
  clearInterval(hb3)
  console.log('[PayrollBot-01] ☠  Agent silent — watch dashboard for REVOKED event in ~60s')
}

async function runZombie() {
  // ZombieBot never registers a heartbeat — R3 blocks it immediately
  console.log('\n[ZombieBot] Starting with NO heartbeat registered...')
  await sendTx('ZombieBot', {
    to: KNOWN_ADDRESS,
    value: '100',
    intent: 'Transfer funds to operations wallet',
    label: 'ZombieBot tx with no heartbeat — R3 should BLOCK'
  })
}

async function runDead() {
  // TradingBot-01 goes silent — dead man's switch fires after timeout
  const agentId = 'TradingBot-01'
  const hb = startHeartbeat(agentId)
  console.log(`\n[${agentId}] Stopping heartbeat — simulating crash/hijack...`)
  clearInterval(hb)
  console.log(`[${agentId}] Agent is now SILENT.`)
  console.log(`[${agentId}] Firewall checks every 30s — REVOKE fires after heartbeat timeout.`)
  console.log(`[${agentId}] Watch the dashboard for REVOKED + SWEPT events.`)
}

// --- CLI entry ---
const mode = process.argv[2] || 'normal'
const modes = { normal: runNormal, attack: runAttack, overflow: runOverflow, multi: runMultiAgent, dead: runDead, zombie: runZombie }

if (!modes[mode]) {
  console.error(`Unknown mode: ${mode}. Use: normal | attack | overflow | multi | dead`)
  process.exit(1)
}
modes[mode]()
