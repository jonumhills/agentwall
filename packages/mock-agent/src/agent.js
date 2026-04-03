import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })

const FIREWALL_URL = process.env.FIREWALL_URL || 'http://localhost:3001'

// Known addresses from allowlist
const KNOWN_ADDRESS = (process.env.ALLOWLIST || '').split(',')[0]?.trim() || '0xAcmeCorpWallet'
const EVIL_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const AGENT_ID = process.env.MOCK_AGENT_ID || 'TradingBot-01'

// Heartbeat
function startHeartbeat() {
  const beat = async () => {
    try {
      await fetch(`${FIREWALL_URL}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: AGENT_ID, owsKeyId: process.env.OWS_KEY_ID || null })
      })
      console.log(`[Agent] ♥ heartbeat sent`)
    } catch (e) {
      console.error('[Agent] Heartbeat failed:', e.message)
    }
  }
  beat()
  return setInterval(beat, 60000) // every 60s
}

// Send a signing request to the firewall
async function sendTx({ to, value, intent, label }) {
  console.log(`\n[Agent] Sending tx: ${label}`)
  try {
    const res = await fetch(`${FIREWALL_URL}/api/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: AGENT_ID,
        chain: 'eip155:11155111', // Ethereum Sepolia
        to,
        value,
        data: '0x',
        intent
      })
    })
    const data = await res.json()
    console.log(`[Agent] Result: ${data.approved ? '✅ APPROVED' : '❌ BLOCKED'}`)
    if (!data.approved) {
      console.log(`[Agent] Failed rules:`, data.result?.failedRules)
    }
    return data
  } catch (e) {
    console.error('[Agent] Request failed:', e.message)
  }
}

// Demo modes
async function runMode(mode) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`[AgentWall Demo] Mode: ${mode.toUpperCase()}`)
  console.log('='.repeat(50))

  const heartbeatInterval = startHeartbeat()

  if (mode === 'normal') {
    // All rules pass
    await sendTx({
      to: KNOWN_ADDRESS,
      value: '50',
      intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
      label: 'Normal payment to known supplier'
    })

  } else if (mode === 'attack') {
    // R1 + R4 fail — unknown address, intent mismatch
    await sendTx({
      to: EVIL_ADDRESS,
      value: '200',
      intent: 'Pay Acme Corp supplier invoice #1042 for Q1 services',
      label: 'ATTACK: prompt injection — known intent, evil address'
    })

  } else if (mode === 'overflow') {
    // R2 fail — over spend cap
    await sendTx({
      to: KNOWN_ADDRESS,
      value: '9999',
      intent: 'Transfer entire treasury balance to operations wallet',
      label: 'ATTACK: over spend cap'
    })

  } else if (mode === 'dead') {
    // Stop heartbeating to trigger R3 / dead man's switch
    console.log('[Agent] Stopping heartbeat — simulating agent crash/hijack...')
    clearInterval(heartbeatInterval)
    console.log('[Agent] Agent is now SILENT. Watch the dashboard for dead man\'s switch...')
    console.log('[Agent] (Firewall checks every 30s — REVOKE will fire after HEARTBEAT_TIMEOUT_MS)')
    return // Don't clear the interval — just let it die
  }

  clearInterval(heartbeatInterval)
}

// CLI: node agent.js <mode>
const mode = process.argv[2] || 'normal'
runMode(mode)
