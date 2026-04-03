import { revokeApiKey, listApiKeys } from '@open-wallet-standard/core'
import { broadcastEvent } from './ws.js'
import { writeAuditLog } from './chain.js'

const TIMEOUT_MS = parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '300000')
const CHECK_INTERVAL_MS = 30000 // check every 30s
const revokedAgents = new Set()
const OWS_READY = process.env.OWS_AGENT_TOKEN && process.env.OWS_AGENT_TOKEN !== 'your_ows_scoped_api_token_here'

// Registry: agentId → OWS API key ID
// Agents register their key ID on first heartbeat via X-OWS-Key-Id header (optional)
export const agentKeyRegistry = {}

async function owsRevokeToken(agentId) {
  if (!OWS_READY) {
    console.log(`[OWS] Token not configured — skipping revocation for ${agentId}`)
    return
  }

  const keyId = agentKeyRegistry[agentId]
  if (keyId) {
    await revokeApiKey(keyId)
    console.log(`[OWS] Revoked key ${keyId} for agent ${agentId}`)
    return
  }

  // Fallback: scan all keys and revoke any matching the agentId in their name
  try {
    const keys = await listApiKeys()
    const match = keys.find(k => k.name && k.name.includes(agentId))
    if (match) {
      await revokeApiKey(match.id)
      console.log(`[OWS] Revoked key ${match.id} (matched by name) for agent ${agentId}`)
    } else {
      console.warn(`[OWS] No OWS key found for agent ${agentId} — manual revocation required`)
    }
  } catch (err) {
    console.error(`[OWS] revokeApiKey failed for ${agentId}:`, err.message)
  }
}

export function startHeartbeatDaemon() {
  setInterval(async () => {
    global.heartbeats = global.heartbeats || {}
    const now = Date.now()

    for (const [agentId, lastBeat] of Object.entries(global.heartbeats)) {
      if (revokedAgents.has(agentId)) continue

      const elapsed = now - lastBeat
      if (elapsed > TIMEOUT_MS) {
        console.log(`[DeadManSwitch] Agent ${agentId} went silent — revoking`)
        revokedAgents.add(agentId)

        const revokeEvent = {
          type: 'REVOKED',
          agentId,
          reason: `No heartbeat in ${Math.round(elapsed / 1000)}s`,
          timestamp: now
        }

        const sweepEvent = {
          type: 'SWEPT',
          agentId,
          to: process.env.RECOVERY_WALLET,
          reason: 'Auto-sweep to recovery wallet after agent revocation',
          timestamp: now + 1
        }

        broadcastEvent(revokeEvent)
        broadcastEvent(sweepEvent)

        await writeAuditLog(revokeEvent).catch(console.error)
        await writeAuditLog(sweepEvent).catch(console.error)

        // Revoke the agent's OWS scoped token
        await owsRevokeToken(agentId).catch(err =>
          console.error(`[OWS] Revocation error for ${agentId}:`, err.message)
        )
      }
    }
  }, CHECK_INTERVAL_MS)

  console.log('[DeadManSwitch] Daemon started — checking every 30s')
}
