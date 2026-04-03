import { ethers } from 'ethers'

const ABI = [
  'event TransactionApproved(string indexed agentId, address to, uint256 value, string intent, uint256 timestamp)',
  'event TransactionBlocked(string indexed agentId, address to, uint256 value, string rule, string reason, uint256 timestamp)',
  'event AgentRevoked(string indexed agentId, string reason, uint256 timestamp)',
  'event FundsSwept(string indexed agentId, address to, uint256 timestamp)',
  'function logApproved(string agentId, address to, uint256 value, string intent) external',
  'function logBlocked(string agentId, address to, uint256 value, string rule, string reason) external',
  'function logRevoked(string agentId, string reason) external',
  'function logSwept(string agentId, address to) external'
]

let contract = null

function getContract() {
  if (contract) return contract
  if (!process.env.AUDIT_LOG_CONTRACT || process.env.AUDIT_LOG_CONTRACT === '0x0000000000000000000000000000000000000000') {
    return null // Contract not yet deployed
  }
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
  contract = new ethers.Contract(process.env.AUDIT_LOG_CONTRACT, ABI, signer)
  return contract
}

export async function writeAuditLog(event) {
  const c = getContract()
  if (!c) {
    console.log('[Chain] Contract not deployed yet — skipping on-chain log')
    return
  }

  try {
    if (event.type === 'APPROVED') {
      const toAddr = ethers.isAddress(event.to) ? event.to : ethers.ZeroAddress
      await c.logApproved(event.agentId, toAddr, 0, event.intent || '')
    } else if (event.type === 'BLOCKED') {
      const toAddr = ethers.isAddress(event.to) ? event.to : ethers.ZeroAddress
      const rule = event.failedRules?.[0]?.rule || 'unknown'
      const reason = event.failedRules?.[0]?.reason || 'unknown'
      await c.logBlocked(event.agentId, toAddr, 0, rule, reason)
    } else if (event.type === 'REVOKED') {
      await c.logRevoked(event.agentId, event.reason || '')
    } else if (event.type === 'SWEPT') {
      const toAddr = ethers.isAddress(event.to) ? event.to : ethers.ZeroAddress
      await c.logSwept(event.agentId, toAddr)
    }
    console.log(`[Chain] ${event.type} logged on-chain`)
  } catch (err) {
    console.error('[Chain] Write failed:', err.message)
  }
}
