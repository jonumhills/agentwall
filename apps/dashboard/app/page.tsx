'use client'
import { useEffect, useState, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type RuleKey = 'r1' | 'r2' | 'r3' | 'r4' | 'r5'
type RuleState = { pass: boolean; reason: string } | 'pending' | 'waiting'

type LiveEval = {
  txId: string
  agentId: string
  to: string
  value: string
  intent: string
  chain: string
  rules: Record<RuleKey, RuleState>
  status: 'evaluating' | 'approved' | 'blocked'
  txHash?: string
  timestamp: number
}

type HistoryEvent = {
  txId: string
  agentId: string
  to: string
  value: string
  intent: string
  status: 'approved' | 'blocked' | 'revoked' | 'swept'
  failedRules: { rule: string; reason: string }[]
  allRules: Partial<Record<RuleKey, { pass: boolean; reason: string }>>
  txHash?: string
  reason?: string
  timestamp: number
}

type Agent = {
  id: string
  spendToday: number
  spendCap: number
  rules: Partial<Record<string, boolean>>
  status: 'alive' | 'revoked'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const RULE_ORDER: RuleKey[] = ['r1', 'r2', 'r3', 'r4', 'r5']

const RULE_META: Record<RuleKey, { label: string; short: string }> = {
  r1: { label: 'Allowlist',     short: 'Recipient on approved list' },
  r2: { label: 'Spend Cap',     short: 'Daily spend limit' },
  r3: { label: 'Liveness',      short: 'Agent heartbeat' },
  r4: { label: 'Intent (AI)',   short: 'Claude semantic check' },
  r5: { label: 'Anomaly',       short: 'Behavioural baseline' },
}

const CONTRACT  = '0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341'
const ETHERSCAN = 'https://sepolia.etherscan.io'
const WS_URL    = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const trunc = (s: string, n = 8) => s ? `${s.slice(0, n)}…${s.slice(-4)}` : ''
const isMockHash = (h?: string) => !h || h.startsWith('0xmock')
const txLink  = (hash?: string) => isMockHash(hash) ? null : `${ETHERSCAN}/tx/${hash}`
const logLink = () => `${ETHERSCAN}/address/${CONTRACT}#events`
const timeStr = (ts: number) => new Date(ts).toLocaleTimeString()

// ─── Sub-components ──────────────────────────────────────────────────────────

function RulePill({ name, state }: { name: RuleKey; state: RuleState }) {
  const meta = RULE_META[name]

  if (state === 'waiting') {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-800 text-gray-600 text-xs">–</span>
        <span className="text-gray-600 text-xs">{meta.label}</span>
        <span className="text-gray-700 text-xs ml-auto">waiting</span>
      </div>
    )
  }

  if (state === 'pending') {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-900 text-yellow-400 text-xs animate-spin">⟳</span>
        <span className="text-yellow-300 text-xs font-medium">{meta.label}</span>
        <span className="text-yellow-600 text-xs ml-auto">evaluating…</span>
      </div>
    )
  }

  const { pass, reason } = state
  return (
    <div className={`rounded py-1.5 px-2 ${pass ? 'bg-green-950' : 'bg-red-950'}`}>
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${pass ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'}`}>
          {pass ? '✓' : '✗'}
        </span>
        <span className={`text-xs font-medium ${pass ? 'text-green-300' : 'text-red-300'}`}>{meta.label}</span>
      </div>
      <p className={`text-xs mt-1 ml-7 leading-relaxed ${pass ? 'text-green-600' : 'text-red-400'}`}>{reason}</p>
    </div>
  )
}

function LiveEvalCard({ ev }: { ev: LiveEval }) {
  const borderColor = ev.status === 'approved' ? 'border-green-700' : ev.status === 'blocked' ? 'border-red-700' : 'border-yellow-700'
  const headerBg    = ev.status === 'approved' ? 'bg-green-900/40' : ev.status === 'blocked' ? 'bg-red-900/40' : 'bg-yellow-900/20'
  const statusLabel = ev.status === 'approved' ? '✅ APPROVED' : ev.status === 'blocked' ? '❌ BLOCKED' : '⟳ EVALUATING'

  return (
    <div className={`bg-gray-900 border ${borderColor} rounded-lg overflow-hidden`}>
      <div className={`${headerBg} px-3 py-2 flex items-center justify-between`}>
        <span className="text-xs font-bold text-white">{ev.agentId}</span>
        <span className="text-xs font-mono text-gray-400">{statusLabel}</span>
      </div>

      <div className="px-3 py-2 border-b border-gray-800 space-y-0.5">
        <div className="flex gap-2 text-xs">
          <span className="text-gray-500 w-10">To</span>
          <span className="text-gray-300 font-mono">{trunc(ev.to)}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-gray-500 w-10">Value</span>
          <span className="text-gray-300">${ev.value}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-gray-500 w-10">Intent</span>
          <span className="text-gray-400 italic truncate">"{ev.intent}"</span>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1">
        {RULE_ORDER.map(r => (
          <RulePill key={r} name={r} state={ev.rules[r]} />
        ))}
      </div>

      {ev.status !== 'evaluating' && (
        <div className="px-3 py-2 border-t border-gray-800 flex gap-3">
          {!isMockHash(ev.txHash) && txLink(ev.txHash) && (
            <a href={txLink(ev.txHash)!} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
              View tx on Etherscan ↗
            </a>
          )}
          <a href={logLink()} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Audit log ↗
          </a>
        </div>
      )}
    </div>
  )
}

function HistoryCard({ ev }: { ev: HistoryEvent }) {
  const [expanded, setExpanded] = useState(false)

  const isRevoked = ev.status === 'revoked'
  const isSwept   = ev.status === 'swept'

  const badge = {
    approved: 'bg-green-900 text-green-300 border-green-700',
    blocked:  'bg-red-900 text-red-300 border-red-700',
    revoked:  'bg-purple-900 text-purple-300 border-purple-700',
    swept:    'bg-amber-900 text-amber-300 border-amber-700',
  }[ev.status]

  const label = {
    approved: '✅ APPROVED',
    blocked:  '❌ BLOCKED',
    revoked:  '☠ REVOKED',
    swept:    '↩ SWEPT',
  }[ev.status]

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-gray-800/50 transition-colors"
      >
        <span className={`text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap mt-0.5 ${badge}`}>{label}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white font-medium">{ev.agentId}</span>
            {ev.to && <span className="text-gray-500">→ {trunc(ev.to)}</span>}
            {parseFloat(ev.value) > 0 && <span className="text-gray-500">${ev.value}</span>}
          </div>
          {ev.intent && (
            <p className="text-xs text-gray-500 italic truncate mt-0.5">"{ev.intent}"</p>
          )}
          {ev.reason && (
            <p className="text-xs text-gray-400 mt-0.5">{ev.reason}</p>
          )}
          {!expanded && ev.failedRules.length > 0 && (
            <div className="flex gap-1 mt-1">
              {ev.failedRules.map(fr => (
                <span key={fr.rule} className="text-xs bg-red-900/60 text-red-400 px-1.5 py-0.5 rounded font-mono">
                  {fr.rule.toUpperCase()} ✗
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-600 whitespace-nowrap">{timeStr(ev.timestamp)}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-3 py-2 space-y-1">
          {RULE_ORDER.map(r => {
            const rule = ev.allRules[r]
            if (!rule) return null
            return (
              <div key={r} className={`flex items-start gap-2 text-xs py-1 rounded px-1.5 ${rule.pass ? 'bg-green-950/50' : 'bg-red-950/50'}`}>
                <span className={`font-bold mt-0.5 ${rule.pass ? 'text-green-400' : 'text-red-400'}`}>
                  {rule.pass ? '✓' : '✗'}
                </span>
                <div>
                  <span className={`font-medium ${rule.pass ? 'text-green-300' : 'text-red-300'}`}>{RULE_META[r].label}</span>
                  <p className={`${rule.pass ? 'text-green-700' : 'text-red-400'} mt-0.5`}>{rule.reason}</p>
                </div>
              </div>
            )
          })}
          <div className="flex gap-3 pt-1">
            {!isMockHash(ev.txHash) && txLink(ev.txHash) && (
              <a href={txLink(ev.txHash)!} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
                View tx ↗
              </a>
            )}
            <a href={logLink()} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
              On-chain audit log ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const pct = Math.min((agent.spendToday / (agent.spendCap || 500)) * 100, 100)
  const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className={`bg-gray-900 border rounded-lg p-3 mb-2 ${agent.status === 'revoked' ? 'border-red-900 opacity-60' : 'border-gray-800'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${agent.status === 'alive' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-medium text-white">{agent.id}</span>
        {agent.status === 'revoked' && (
          <span className="ml-auto text-xs bg-red-900 text-red-400 px-1.5 py-0.5 rounded">REVOKED</span>
        )}
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Spend</span>
          <span>${agent.spendToday.toFixed(0)} / ${agent.spendCap}</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full">
          <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex gap-1">
        {RULE_ORDER.map(r => {
          const pass = agent.rules[r.toUpperCase()]
          return (
            <span key={r} className={`text-xs px-1.5 py-0.5 rounded font-mono ${pass === undefined ? 'bg-gray-800 text-gray-500' : pass ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              {r.toUpperCase()}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AgentWallDashboard() {
  const [liveEval, setLiveEval]   = useState<LiveEval | null>(null)
  const [history, setHistory]     = useState<HistoryEvent[]>([])
  const [agents, setAgents]       = useState<Record<string, Agent>>({})
  const [stats, setStats]         = useState({ total: 0, approved: 0, blocked: 0, revoked: 0 })
  const [connected, setConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket(WS_URL)
      ws.current.onopen  = () => setConnected(true)
      ws.current.onclose = () => { setConnected(false); setTimeout(connect, 3000) }
      ws.current.onmessage = (msg) => handle(JSON.parse(msg.data))
    }
    connect()
    return () => ws.current?.close()
  }, [])

  function handle(ev: any) {
    if (ev.type === 'connected') return

      // New tx starting evaluation
    if (ev.type === 'EVALUATING') {
      setLiveEval({
        txId: ev.txId, agentId: ev.agentId, chain: ev.chain,
        to: ev.to, value: ev.value, intent: ev.intent,
        rules: { r1: 'pending', r2: 'waiting', r3: 'waiting', r4: 'waiting', r5: 'waiting' },
        status: 'evaluating',
        timestamp: ev.timestamp
      })
      // Update agent spend cap from server-provided value
      if (ev.agentId && ev.spendCap) {
        setAgents(prev => ({
          ...prev,
          [ev.agentId]: {
            ...(prev[ev.agentId] || { id: ev.agentId, spendToday: 0, rules: {}, status: 'alive' as const }),
            spendCap: ev.spendCap
          }
        }))
      }
      return
    }

    // Individual rule completed
    if (ev.type === 'RULE_RESULT') {
      setLiveEval(prev => {
        if (!prev || prev.txId !== ev.txId) return prev
        const rules = { ...prev.rules }
        rules[ev.rule as RuleKey] = { pass: ev.pass, reason: ev.reason }
        // Advance next rule to 'pending'
        const idx = RULE_ORDER.indexOf(ev.rule as RuleKey)
        if (idx >= 0 && idx < RULE_ORDER.length - 1) {
          rules[RULE_ORDER[idx + 1]] = 'pending'
        }
        return { ...prev, rules }
      })
      return
    }

    // Final result
    if (ev.type === 'APPROVED' || ev.type === 'BLOCKED') {
      setStats(prev => ({
        total: prev.total + 1,
        approved: ev.type === 'APPROVED' ? prev.approved + 1 : prev.approved,
        blocked:  ev.type === 'BLOCKED'  ? prev.blocked  + 1 : prev.blocked,
        revoked: prev.revoked
      }))

      setLiveEval(prev => {
        if (!prev) return null
        // Fill in any rules from the final event that weren't streamed
        const rules = { ...prev.rules }
        if (ev.rules) {
          RULE_ORDER.forEach(r => {
            if (ev.rules[r] && (rules[r] === 'waiting' || rules[r] === 'pending')) {
              rules[r] = ev.rules[r]
            }
          })
        }
        const updated: LiveEval = {
          ...prev,
          status: ev.type === 'APPROVED' ? 'approved' : 'blocked',
          txHash: ev.txHash,
          rules
        }
        // Move to history after 2.5s — only clear liveEval if txId still matches
        const completedTxId = updated.txId
        const historyEntry: HistoryEvent = {
          txId: updated.txId,
          agentId: updated.agentId,
          to: updated.to,
          value: updated.value,
          intent: updated.intent,
          status: updated.status as 'approved' | 'blocked',
          failedRules: ev.failedRules || [],
          allRules: ev.rules || {},
          txHash: updated.txHash,
          timestamp: updated.timestamp
        }
        setHistory(h => [historyEntry, ...h].slice(0, 50))
        setTimeout(() => {
          setLiveEval(curr => curr?.txId === completedTxId ? null : curr)
        }, 2500)
        return updated
      })

      if (ev.agentId) {
        setAgents(prev => {
          const existing = prev[ev.agentId] || {
            id: ev.agentId, spendToday: 0, spendCap: 500,
            rules: {}, status: 'alive' as const
          }
          const updated = { ...existing }
          if (ev.rules) {
            updated.rules = {
              R1: ev.rules.r1?.pass ?? true,
              R2: ev.rules.r2?.pass ?? true,
              R3: ev.rules.r3?.pass ?? true,
              R4: ev.rules.r4?.pass ?? true,
              R5: ev.rules.r5?.pass ?? true,
            }
          }
          if (ev.type === 'APPROVED') updated.spendToday += parseFloat(ev.value || '0')
          return { ...prev, [ev.agentId]: updated }
        })
      }
      return
    }

    // Revoked / swept
    if (ev.type === 'REVOKED' || ev.type === 'SWEPT') {
      if (ev.type === 'REVOKED') {
        setStats(prev => ({ ...prev, revoked: prev.revoked + 1 }))
        if (ev.agentId) {
          setAgents(prev => ({
            ...prev,
            [ev.agentId]: {
              ...(prev[ev.agentId] || { id: ev.agentId, spendToday: 0, spendCap: 500, rules: {} }),
              status: 'revoked'
            }
          }))
        }
      }
      setHistory(h => [{
        txId: `${ev.type}-${ev.timestamp}`,
        agentId: ev.agentId || '',
        to: ev.to || '',
        value: '0',
        intent: '',
        status: ev.type.toLowerCase() as 'revoked' | 'swept',
        failedRules: [],
        allRules: {},
        reason: ev.reason,
        timestamp: ev.timestamp
      }, ...h].slice(0, 50))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-5 font-mono text-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">AgentWall</h1>
          <p className="text-xs text-gray-500 mt-0.5">OWS execution firewall · Ethereum Sepolia</p>
        </div>
        <div className="flex items-center gap-4">
          <a href={logLink()} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
            On-chain audit log ↗
          </a>
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${connected ? 'border-green-800 text-green-400' : 'border-red-800 text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Firewall Online' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total txs',      value: stats.total,    color: 'text-white' },
          { label: 'Approved',       value: stats.approved, color: 'text-green-400' },
          { label: 'Blocked',        value: stats.blocked,  color: 'text-red-400' },
          { label: 'Agents revoked', value: stats.revoked,  color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Left column: live eval + agents */}
        <div className="col-span-1 space-y-4">

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Live Evaluation</div>
            {liveEval
              ? <LiveEvalCard ev={liveEval} />
              : (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                  <div className="text-gray-700 text-xs">Waiting for transaction...</div>
                  <div className="text-gray-800 text-xs mt-1">Run an agent to see live rule evaluation</div>
                </div>
              )
            }
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Active Agents</div>
            {Object.keys(agents).length === 0
              ? <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-700 text-center">No agents yet</div>
              : Object.values(agents).map(a => <AgentCard key={a.id} agent={a} />)
            }
          </div>

        </div>

        {/* Right column: event history */}
        <div className="col-span-2">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Event History
            <span className="ml-2 text-gray-700 normal-case">click any row to expand rule details</span>
          </div>
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {history.length === 0
              ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
                  <div className="text-gray-700 text-xs">No events yet</div>
                  <div className="text-gray-800 text-xs mt-1">npm run dev:agent:multi</div>
                </div>
              )
              : history.map((ev, i) => <HistoryCard key={`${ev.txId}-${i}`} ev={ev} />)
            }
          </div>
        </div>

      </div>
    </div>
  )
}
