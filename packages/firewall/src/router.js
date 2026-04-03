import { Router } from 'express'
import { signTransaction } from '@open-wallet-standard/core'
import { runFirewall } from './firewall.js'
import { broadcastEvent } from './ws.js'
import { writeAuditLog } from './chain.js'

const OWS_TOKEN = process.env.OWS_AGENT_TOKEN
const OWS_WALLET = process.env.OWS_WALLET_NAME || 'agentwall-demo'
const OWS_READY = OWS_TOKEN && OWS_TOKEN !== 'your_ows_scoped_api_token_here'

async function owsSign(chain, txHex) {
  const result = await signTransaction(OWS_WALLET, chain, txHex, OWS_TOKEN)
  return result.signature
}

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

        if (OWS_READY && signingRequest.data && signingRequest.data !== '0x') {
          try {
            signedTx = await owsSign(signingRequest.chain, signingRequest.data)
            txHash = signedTx
            console.log(`[OWS] Signed tx for ${agentId}: ${txHash}`)
          } catch (owsErr) {
            console.error('[OWS] Sign failed — returning mock hash:', owsErr.message)
          }
        } else if (!OWS_READY) {
          console.log('[OWS] Token not configured — using mock tx hash')
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

  return router
}
