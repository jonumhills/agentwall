import { getAgentConfig } from '../registry.js'

export async function checkAllowlist(agentId, to) {
  const { allowlist } = getAgentConfig(agentId)
  const pass = allowlist.map(a => a.toLowerCase()).includes(to.toLowerCase())
  return {
    pass,
    reason: pass
      ? `Address ${to} is on allowlist`
      : `Address ${to} is NOT on allowlist for agent ${agentId}`
  }
}
