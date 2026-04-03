'use client'
import { useEffect, useState, useRef } from 'react'

type FirewallEvent = {
  type: 'APPROVED' | 'BLOCKED' | 'REVOKED' | 'SWEPT' | 'connected'
  agentId?: string
  to?: string
  value?: string
  intent?: string
  failedRules?: { rule: string; reason: string }[]
  rules?: Record<string, { pass: boolean; reason: string }>
  reason?: string
  timestamp: number
}

type Agent = {
  id: string
  lastBeat: number
  spendToday: number
  rules: Record<string, boolean>
  status: 'alive' | 'revoked'
}

const SPEND_CAP = 500
const RULE_LABELS = ['R1', 'R2', 'R3', 'R4', 'R5']
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002'

export default function AgentWallDashboard() {
  const [events, setEvents] = useState<FirewallEvent[]>([])
  const [agents, setAgents] = useState<Record<string, Agent>>({})
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({ total: 0, approved: 0, blocked: 0, revoked: 0 })
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => setConnected(true)
      ws.current.onclose = () => {
        setConnected(false)
        setTimeout(connect, 3000) // auto-reconnect
      }

      ws.current.onmessage = (msg) => {
        const event: FirewallEvent = JSON.parse(msg.data)
        if (event.type === 'connected') return

        setEvents(prev => [event, ...prev].slice(0, 100))

        // Update stats
        setStats(prev => ({
          total: prev.total + 1,
          approved: event.type === 'APPROVED' ? prev.approved + 1 : prev.approved,
          blocked: event.type === 'BLOCKED' ? prev.blocked + 1 : prev.blocked,
          revoked: event.type === 'REVOKED' ? prev.revoked + 1 : prev.revoked,
        }))

        // Update agent state
        if (event.agentId) {
          setAgents(prev => {
            const existing = prev[event.agentId!] || {
              id: event.agentId!,
              lastBeat: Date.now(),
              spendToday: 0,
              rules: { R1: true, R2: true, R3: true, R4: true, R5: true },
              status: 'alive' as const
            }

            const updated = { ...existing }

            if (event.rules) {
              updated.rules = {
                R1: event.rules.r1?.pass ?? true,
                R2: event.rules.r2?.pass ?? true,
                R3: event.rules.r3?.pass ?? true,
                R4: event.rules.r4?.pass ?? true,
                R5: event.rules.r5?.pass ?? true,
              }
            }

            if (event.type === 'APPROVED') {
              updated.spendToday += parseFloat(event.value || '0')
              updated.lastBeat = Date.now()
            }

            if (event.type === 'REVOKED') {
              updated.status = 'revoked'
            }

            return { ...prev, [event.agentId!]: updated }
          })
        }
      }
    }

    connect()
    return () => ws.current?.close()
  }, [])

  const eventColor = (type: string) => {
    if (type === 'APPROVED') return 'bg-green-50 border-green-200 text-green-800'
    if (type === 'BLOCKED') return 'bg-red-50 border-red-200 text-red-800'
    if (type === 'REVOKED') return 'bg-purple-50 border-purple-200 text-purple-800'
    if (type === 'SWEPT') return 'bg-amber-50 border-amber-200 text-amber-800'
    return 'bg-gray-50 border-gray-200 text-gray-600'
  }

  const rulePillColor = (pass: boolean) =>
    pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">AgentWall</h1>
          <p className="text-sm text-gray-500 mt-0.5">Execution firewall for OWS agent wallets</p>
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {connected ? 'Firewall Online' : 'Connecting...'}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total txs', value: stats.total, color: 'text-gray-900' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { label: 'Blocked', value: stats.blocked, color: 'text-red-600' },
          { label: 'Agents revoked', value: stats.revoked, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Agent status panel */}
        <div className="col-span-1">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Active Agents</h2>
          {Object.values(agents).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-400 text-center">
              No agents yet — start the mock agent
            </div>
          ) : (
            Object.values(agents).map(agent => (
              <div key={agent.id} className={`bg-white border rounded-xl p-4 mb-3 ${agent.status === 'revoked' ? 'border-red-200 opacity-60' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'alive' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium text-gray-900">{agent.id}</span>
                  {agent.status === 'revoked' && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-auto">REVOKED</span>
                  )}
                </div>

                {/* Spend cap bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Spend cap</span>
                    <span>${agent.spendToday.toFixed(0)} / ${SPEND_CAP}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${agent.spendToday / SPEND_CAP > 0.8 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((agent.spendToday / SPEND_CAP) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Rule pills */}
                <div className="flex gap-1.5">
                  {RULE_LABELS.map(r => (
                    <div key={r} className={`text-xs font-medium px-2 py-1 rounded-full ${rulePillColor(agent.rules[r] ?? true)}`}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live firewall feed */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Live Firewall Feed</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-sm text-gray-400 text-center">
                Waiting for transactions...
              </div>
            ) : (
              events.map((event, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-400 font-mono w-16 flex-shrink-0 pt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md border flex-shrink-0 ${eventColor(event.type)}`}>
                    {event.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-700 truncate">
                      {event.agentId && <span className="font-medium">{event.agentId}</span>}
                      {event.to && <span className="text-gray-400"> → {event.to.slice(0, 10)}...</span>}
                      {event.value && parseFloat(event.value) > 0 && <span className="text-gray-400"> · ${event.value}</span>}
                      {event.intent && <span className="text-gray-400"> · &quot;{event.intent.slice(0, 40)}{event.intent.length > 40 ? '...' : ''}&quot;</span>}
                      {event.reason && <span className="text-gray-600"> · {event.reason.slice(0, 60)}</span>}
                    </div>
                    {event.failedRules && event.failedRules.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {event.failedRules.map(fr => (
                          <span key={fr.rule} className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            {fr.rule} ✗
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
