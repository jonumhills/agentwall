import { wss } from './index.js'

export function broadcastEvent(event) {
  if (!wss) return
  const message = JSON.stringify(event)
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message)
    }
  })
}
