import express from 'express'
import { WebSocketServer } from 'ws'
import { createFirewallRouter } from './router.js'
import { startHeartbeatDaemon, agentKeyRegistry } from './heartbeat.js'
import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })

const app = express()
app.use(express.json())

// WebSocket server for dashboard
const wss = new WebSocketServer({ port: process.env.WS_PORT || 3002 })
wss.on('connection', (ws) => {
  console.log('[WS] Dashboard connected')
  ws.send(JSON.stringify({ type: 'connected', message: 'AgentWall firewall online' }))
})
export { wss }

// Routes
app.use('/api', createFirewallRouter())

// Heartbeat endpoint for agents
app.post('/heartbeat', (req, res) => {
  const { agentId, owsKeyId } = req.body
  if (!agentId) return res.status(400).json({ error: 'agentId required' })
  global.heartbeats = global.heartbeats || {}
  global.heartbeats[agentId] = Date.now()
  // Register the agent's OWS key ID if provided (used for revocation)
  if (owsKeyId) agentKeyRegistry[agentId] = owsKeyId
  res.json({ ok: true, timestamp: Date.now() })
})

// Start dead man's switch daemon
startHeartbeatDaemon()

app.listen(process.env.FIREWALL_PORT || 3001, () => {
  console.log(`[AgentWall] Firewall running on :${process.env.FIREWALL_PORT || 3001}`)
  console.log(`[AgentWall] WS broadcast on :${process.env.WS_PORT || 3002}`)
})
