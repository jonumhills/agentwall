import { checkAllowlist } from './rules/r1-allowlist.js'
import { checkSpendCap } from './rules/r2-spendcap.js'
import { checkLiveness } from './rules/r3-liveness.js'
import { checkIntent } from './rules/r4-intent.js'
import { checkAnomaly } from './rules/r5-anomaly.js'

// In-memory spend tracker (replace with DB for production)
export const spendLedger = {}
export const auditLog = []

export async function runFirewall(req) {
  const { agentId, chain, to, value, intent } = req
  const results = {}

  // Run all 5 rules
  results.r1 = await checkAllowlist(to)
  results.r2 = await checkSpendCap(agentId, value)
  results.r3 = await checkLiveness(agentId)
  results.r4 = await checkIntent(intent, { to, value, chain })
  results.r5 = await checkAnomaly(agentId, { to, value, chain })

  const failedRules = Object.entries(results)
    .filter(([, r]) => !r.pass)
    .map(([rule, r]) => ({ rule, reason: r.reason }))

  const approved = failedRules.length === 0

  const event = {
    agentId,
    chain,
    to,
    value,
    intent,
    approved,
    failedRules,
    rules: results,
    timestamp: Date.now()
  }

  // Append to in-memory audit log
  auditLog.push(event)

  // Update spend ledger if approved
  if (approved) {
    spendLedger[agentId] = (spendLedger[agentId] || 0) + parseFloat(value || 0)
  }

  return event
}
