import { revokeApiKey, listApiKeys } from '@open-wallet-standard/core'
import { broadcastEvent } from './ws.js'
import { writeAuditLog } from './chain.js'
import { getAgentConfig, listAgents } from './registry.js'

const CHECK_INTERVAL_MS = parseInt(process.env.HEARTBEAT_CHECK_MS || '30000')
const revokedAgents = new Set()

// Registry: agentId → OWS API key ID (populated on heartbeat)
export const agentKeyRegistry = {}

async function owsRevokeToken(agentId) {
  const agentCfg = getAgentConfig(agentId)
  const owsReady = agentCfg.owsToken && !agentCfg.owsToken.startsWith('ows_key_your')

  if (!owsReady) {
    console.log(`[OWS] No token configured for ${agentId} — skipping revocation`)
    return
  }

  // Use keyId from heartbeat registry first, then config, then scan by name
  const keyId = agentKeyRegistry[agentId] || agentCfg.owsKeyId

  if (keyId) {
    try {
      await revokeApiKey(keyId)
      console.log(`[OWS] Revoked key ${keyId} for agent ${agentId}`)
    } catch (err) {
      console.error(`[OWS] revokeApiKey failed for ${agentId}:`, err.message)
    }
    return
  }

  // Fallback: scan all keys by name
  try {
    const keys = await listApiKeys()
    const match = keys.find(k => k.name && k.name.includes(agentId))
    if (match) {
      await revokeApiKey(match.id)
      console.log(`[OWS] Revoked key ${match.id} (name match) for agent ${agentId}`)
    } else {
      console.warn(`[OWS] No OWS key found for agent ${agentId} — manual revocation required`)
    }
  } catch (err) {
    console.error(`[OWS] listApiKeys failed:`, err.message)
  }
}

export function startHeartbeatDaemon() {
  setInterval(async () => {
    global.heartbeats = global.heartbeats || {}
    const now = Date.now()

    for (const [agentId, lastBeat] of Object.entries(global.heartbeats)) {
      if (revokedAgents.has(agentId)) continue

      // Use per-agent timeout from config
      const { heartbeatTimeoutMs, recoveryWallet } = getAgentConfig(agentId)
      const timeout = heartbeatTimeoutMs || parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '300000')
      const elapsed = now - lastBeat

      if (elapsed > timeout) {
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
          to: recoveryWallet || process.env.RECOVERY_WALLET,
          reason: 'Auto-sweep to recovery wallet after agent revocation',
          timestamp: now + 1
        }

        broadcastEvent(revokeEvent)
        broadcastEvent(sweepEvent)

        await writeAuditLog(revokeEvent).catch(console.error)
        await writeAuditLog(sweepEvent).catch(console.error)

        // Revoke this agent's specific OWS token
        await owsRevokeToken(agentId).catch(err =>
          console.error(`[OWS] Revocation error for ${agentId}:`, err.message)
        )
      }
    }
  }, CHECK_INTERVAL_MS)

  console.log('[DeadManSwitch] Daemon started — checking every 30s')
}
