const TIMEOUT_MS = parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '300000') // 5 min default

export async function checkLiveness(agentId) {
  global.heartbeats = global.heartbeats || {}
  const lastBeat = global.heartbeats[agentId]

  if (!lastBeat) {
    return { pass: false, reason: `No heartbeat registered for agent ${agentId}` }
  }

  const elapsed = Date.now() - lastBeat
  const alive = elapsed < TIMEOUT_MS
  return {
    pass: alive,
    reason: alive
      ? `Alive — last heartbeat ${Math.round(elapsed / 1000)}s ago`
      : `Dead — no heartbeat in ${Math.round(elapsed / 1000)}s (limit: ${TIMEOUT_MS / 1000}s)`
  }
}
