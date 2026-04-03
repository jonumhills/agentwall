import { readFileSync } from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })

// Load agentwall.config.json from repo root
const CONFIG_PATH = resolve('../../agentwall.config.json')

let config = null

function loadConfig() {
  if (config) return config
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8')
    config = JSON.parse(raw)
    console.log(`[Registry] Loaded ${Object.keys(config.agents).length} agents from agentwall.config.json`)
  } catch (err) {
    console.warn('[Registry] agentwall.config.json not found or invalid — using .env fallback')
    config = { agents: {} }
  }
  return config
}

// Fallback agent config built from .env (for backwards compat / single-agent use)
function envFallback(agentId) {
  return {
    owsWallet: process.env.OWS_WALLET_NAME || 'agentwall-demo',
    owsToken: process.env.OWS_AGENT_TOKEN || '',
    owsKeyId: process.env.OWS_KEY_ID || '',
    allowedChains: ['eip155:11155111'],
    spendCapUSDC: parseFloat(process.env.SPEND_CAP_USDC || '500'),
    allowlist: (process.env.ALLOWLIST || '').split(',').map(a => a.trim()).filter(Boolean),
    heartbeatTimeoutMs: parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '300000')
  }
}

/**
 * Get config for a specific agent.
 * Falls back to .env globals if agent not found in config file.
 */
export function getAgentConfig(agentId) {
  const cfg = loadConfig()
  const agent = cfg.agents[agentId]

  if (!agent) {
    console.warn(`[Registry] Agent "${agentId}" not in config — using .env fallback`)
    return envFallback(agentId)
  }

  // Per-agent token falls back to global OWS_AGENT_TOKEN if not set
  return {
    owsWallet: agent.owsWallet || process.env.OWS_WALLET_NAME || 'agentwall-demo',
    owsToken: agent.owsToken || process.env.OWS_AGENT_TOKEN || '',
    owsKeyId: agent.owsKeyId || process.env.OWS_KEY_ID || '',
    allowedChains: agent.allowedChains || ['eip155:11155111'],
    spendCapUSDC: agent.spendCapUSDC ?? parseFloat(process.env.SPEND_CAP_USDC || '500'),
    allowlist: agent.allowlist || (process.env.ALLOWLIST || '').split(',').map(a => a.trim()).filter(Boolean),
    heartbeatTimeoutMs: agent.heartbeatTimeoutMs ?? parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '300000')
  }
}

/**
 * List all registered agent IDs.
 */
export function listAgents() {
  return Object.keys(loadConfig().agents)
}

/**
 * Check if a chain is allowed for an agent.
 */
export function isChainAllowed(agentId, chain) {
  const cfg = getAgentConfig(agentId)
  return cfg.allowedChains.includes(chain)
}
