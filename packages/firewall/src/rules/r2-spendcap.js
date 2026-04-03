import { spendLedger } from '../firewall.js'
import { getAgentConfig } from '../registry.js'

export async function checkSpendCap(agentId, value) {
  const { spendCapUSDC } = getAgentConfig(agentId)
  const spent = spendLedger[agentId] || 0
  const txAmount = parseFloat(value || 0)
  const wouldExceed = (spent + txAmount) > spendCapUSDC
  return {
    pass: !wouldExceed,
    reason: wouldExceed
      ? `Spend cap exceeded: $${spent + txAmount} > $${spendCapUSDC} limit for agent ${agentId}`
      : `Within cap: $${spent + txAmount} of $${spendCapUSDC} for agent ${agentId}`
  }
}
