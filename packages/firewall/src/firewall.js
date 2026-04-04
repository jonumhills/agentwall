import { checkAllowlist } from './rules/r1-allowlist.js'
import { checkSpendCap } from './rules/r2-spendcap.js'
import { checkLiveness } from './rules/r3-liveness.js'
import { checkIntent } from './rules/r4-intent.js'
import { checkAnomaly } from './rules/r5-anomaly.js'
import { isChainAllowed } from './registry.js'

export const spendLedger = {}
export const auditLog = []

// onRule(ruleName, result) called after each rule completes — used for live dashboard streaming
export async function runFirewall(req, onRule = async () => {}) {
  const { agentId, chain, to, value, intent } = req
  const results = {}

  if (!isChainAllowed(agentId, chain)) {
    const chainBlock = { pass: false, reason: `Chain ${chain} not allowed for agent ${agentId}` }
    return {
      agentId, chain, to, value, intent,
      approved: false,
      failedRules: [{ rule: 'chain', reason: chainBlock.reason }],
      rules: { chain: chainBlock },
      timestamp: Date.now()
    }
  }

  results.r1 = await checkAllowlist(agentId, to)
  await onRule('r1', results.r1)

  results.r2 = await checkSpendCap(agentId, value)
  await onRule('r2', results.r2)

  results.r3 = await checkLiveness(agentId)
  await onRule('r3', results.r3)

  results.r4 = await checkIntent(intent, { to, value, chain })
  await onRule('r4', results.r4)

  results.r5 = await checkAnomaly(agentId, { to, value, chain })
  await onRule('r5', results.r5)

  const failedRules = Object.entries(results)
    .filter(([, r]) => !r.pass)
    .map(([rule, r]) => ({ rule, reason: r.reason }))

  const approved = failedRules.length === 0

  const event = { agentId, chain, to, value, intent, approved, failedRules, rules: results, timestamp: Date.now() }

  auditLog.push(event)

  if (approved) {
    spendLedger[agentId] = (spendLedger[agentId] || 0) + parseFloat(value || 0)
  }

  return event
}
