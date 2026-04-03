import { spendLedger } from '../firewall.js'
const CAP = parseFloat(process.env.SPEND_CAP_USDC || '500')

export async function checkSpendCap(agentId, value) {
  const spent = spendLedger[agentId] || 0
  const txAmount = parseFloat(value || 0)
  const wouldExceed = (spent + txAmount) > CAP
  return {
    pass: !wouldExceed,
    reason: wouldExceed
      ? `Spend cap exceeded: $${spent + txAmount} > $${CAP} limit`
      : `Within cap: $${spent + txAmount} of $${CAP}`
  }
}
