import { Router } from 'express'
import { signTransaction } from '@open-wallet-standard/core'
import { runFirewall } from './firewall.js'
import { broadcastEvent } from './ws.js'
import { writeAuditLog } from './chain.js'
import { getAgentConfig, listAgents } from './registry.js'

export function createFirewallRouter() {
  const router = Router()

  // Agent calls POST /api/sign with tx + intent
  router.post('/sign', async (req, res) => {
    const { agentId, chain, to, value, data, intent } = req.body

    if (!agentId || !chain || !to || !intent) {
      return res.status(400).json({ error: 'agentId, chain, to, intent are required' })
    }

    const signingRequest = { agentId, chain, to, value: value || '0', data: data || '0x', intent }

    try {
      const result = await runFirewall(signingRequest)

      // Broadcast to dashboard
      broadcastEvent({
        type: result.approved ? 'APPROVED' : 'BLOCKED',
        ...result,
        timestamp: Date.now()
      })

      // Write to on-chain audit log
      await writeAuditLog(result).catch(err => console.error('[Chain] Audit log write failed:', err))

      if (result.approved) {
        let txHash = '0xmock_signed_tx_hash'
        let signedTx = null

        // Look up this agent's specific OWS wallet + token
        const agentCfg = getAgentConfig(agentId)
        const owsReady = agentCfg.owsToken && !agentCfg.owsToken.startsWith('ows_key_your')

        if (owsReady && data && data !== '0x') {
          try {
            signedTx = await signTransaction(agentCfg.owsWallet, chain, data, agentCfg.owsToken)
            txHash = signedTx
            console.log(`[OWS] Signed tx for ${agentId} via wallet "${agentCfg.owsWallet}": ${txHash}`)
          } catch (owsErr) {
            console.error(`[OWS] Sign failed for ${agentId}:`, owsErr.message)
          }
        } else if (!owsReady) {
          console.log(`[OWS] No token configured for ${agentId} — returning mock hash`)
        }

        return res.json({ approved: true, txHash, signedTx, result })
      } else {
        return res.status(403).json({ approved: false, result })
      }
    } catch (err) {
      console.error('[Firewall] Error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  // List all registered agents and their config (without tokens)
  router.get('/agents', (req, res) => {
    const agents = listAgents().map(id => {
      const cfg = getAgentConfig(id)
      return {
        agentId: id,
        owsWallet: cfg.owsWallet,
        allowedChains: cfg.allowedChains,
        spendCapUSDC: cfg.spendCapUSDC,
        allowlistCount: cfg.allowlist.length,
        heartbeatTimeoutMs: cfg.heartbeatTimeoutMs
      }
    })
    res.json({ agents })
  })

  return router
}
