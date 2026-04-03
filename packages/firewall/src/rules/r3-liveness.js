import { getAgentConfig } from '../registry.js'

export async function checkLiveness(agentId) {
  const { heartbeatTimeoutMs } = getAgentConfig(agentId)
  global.heartbeats = global.heartbeats || {}
  const lastBeat = global.heartbeats[agentId]

  if (!lastBeat) {
    return { pass: false, reason: `No heartbeat registered for agent ${agentId}` }
  }

  const elapsed = Date.now() - lastBeat
  const alive = elapsed < heartbeatTimeoutMs
  return {
    pass: alive,
    reason: alive
      ? `Alive — last heartbeat ${Math.round(elapsed / 1000)}s ago`
      : `Dead — no heartbeat in ${Math.round(elapsed / 1000)}s (limit: ${heartbeatTimeoutMs / 1000}s)`
  }
}
