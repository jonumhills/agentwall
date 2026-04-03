import { auditLog } from '../firewall.js'

export async function checkAnomaly(agentId, tx) {
  const agentHistory = auditLog.filter(e => e.agentId === agentId && e.approved)

  if (agentHistory.length < 3) {
    return { pass: true, reason: 'Insufficient history for anomaly detection — baseline building' }
  }

  const amounts = agentHistory.map(e => parseFloat(e.value || 0))
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const currentAmount = parseFloat(tx.value || 0)

  // Flag if tx is more than 5x the average
  const spikeThreshold = avgAmount * 5
  if (currentAmount > spikeThreshold && currentAmount > 10) {
    return {
      pass: false,
      reason: `Amount $${currentAmount} is ${(currentAmount / avgAmount).toFixed(1)}x above agent average ($${avgAmount.toFixed(2)})`
    }
  }

  // Check off-hours (between midnight and 6am UTC)
  const hour = new Date().getUTCHours()
  const offHours = hour >= 0 && hour < 6
  const hasOtherIssues = tx.to && !agentHistory.some(e => e.to === tx.to)
  if (offHours && hasOtherIssues) {
    return {
      pass: false,
      reason: `Off-hours transaction (${hour}:00 UTC) to new recipient — flagged for review`
    }
  }

  return { pass: true, reason: 'Transaction matches agent behavioural baseline' }
}
