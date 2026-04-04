import Link from 'next/link'

const GITHUB = 'https://github.com/jonumhills/agentwall'
const DASHBOARD = '/dashboard'
const ETHERSCAN = 'https://sepolia.etherscan.io/address/0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341#events'

const rules = [
  {
    id: 'R1', name: 'Allowlist', icon: '🔐',
    desc: 'Every recipient address is checked against a per-agent approved list. Unknown addresses are blocked instantly.',
    example: 'Burn address → BLOCKED',
    border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'R2', name: 'Spend Cap', icon: '💰',
    desc: 'Each agent has its own daily spend limit. Transactions that exceed the cap are blocked regardless of other rules.',
    example: '$200 tx, $100 cap → BLOCKED',
    border: 'border-green-200', badge: 'bg-green-100 text-green-700',
  },
  {
    id: 'R3', name: 'Liveness', icon: '♥',
    desc: 'Agents must send a heartbeat every 60s. No heartbeat = no signing. Silence triggers Dead Man\'s Switch.',
    example: 'No heartbeat → REVOKED',
    border: 'border-red-200', badge: 'bg-red-100 text-red-700',
  },
  {
    id: 'R4', name: 'Intent Verification', icon: '🤖',
    desc: 'Claude reads the agent\'s stated intent and verifies it matches the actual transaction — semantically, not syntactically.',
    example: '"Pay supplier" → burn address → BLOCKED',
    border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'R5', name: 'Anomaly Detection', icon: '📊',
    desc: 'Flags amounts 5× above an agent\'s baseline or off-hours transfers to new recipients.',
    example: 'Usual $50 → sudden $5,000 → BLOCKED',
    border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700',
  },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen font-sans text-gray-800"
      style={{
        backgroundColor: '#cfe8d0',
        backgroundImage: `
          linear-gradient(rgba(100,160,100,0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100,160,100,0.18) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
      }}
    >

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-[#cfe8d0]/80 border-b border-green-300/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold text-orange-600 tracking-tight text-lg">AgentWall</span>
          <div className="flex items-center gap-4">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer"
              className="text-sm text-green-800 hover:text-orange-600 transition-colors font-medium">GitHub</a>
            <Link href={DASHBOARD}
              className="text-sm bg-orange-500 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-sm">
              Live Dashboard →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-green-100 border border-green-300 text-green-800 px-3 py-1.5 rounded-full mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          OWS Hackathon · Track 02 · Agent Spend Governance &amp; Identity
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-orange-500 tracking-tight leading-none mb-4"
          style={{ fontFamily: 'system-ui, sans-serif', textShadow: '2px 2px 0 rgba(0,0,0,0.08)' }}>
          AgentWall
        </h1>

        <p className="text-xl sm:text-2xl font-bold text-green-900 mb-6">
          Execution Firewall for OWS Wallets
        </p>

        <p className="text-base text-green-800/80 max-w-xl mx-auto mb-10 leading-relaxed">
          Every transaction an AI agent tries to sign passes through 5 rules first.
          Any rule fails — the key never decrypts.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href={DASHBOARD}
            className="bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-md">
            View Live Dashboard →
          </Link>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer"
            className="bg-white/70 border border-green-300 text-green-900 px-6 py-3 rounded-full font-semibold hover:bg-white transition-colors">
            GitHub ↗
          </a>
          <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer"
            className="bg-white/70 border border-green-300 text-green-900 px-6 py-3 rounded-full font-semibold hover:bg-white transition-colors">
            On-chain Audit ↗
          </a>
        </div>
      </section>

      {/* Flow */}
      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/60 border border-green-200 rounded-2xl px-6 py-5 flex flex-wrap items-center justify-center gap-2 text-sm font-mono shadow-sm">
            {[
              { label: 'AI Agent', cls: 'bg-green-100 text-green-800 border border-green-200' },
              { label: '→' },
              { label: 'POST /api/sign', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
              { label: '→' },
              { label: 'AgentWall ✦', cls: 'bg-orange-500 text-white font-bold' },
              { label: '→' },
              { label: '5 Rules', cls: 'bg-green-100 text-green-800 border border-green-200' },
              { label: '→' },
              { label: 'OWS Vault', cls: 'bg-green-600 text-white' },
              { label: '→' },
              { label: 'Ethereum', cls: 'bg-green-100 text-green-800 border border-green-200' },
            ].map((item, i) =>
              item.label === '→'
                ? <span key={i} className="text-green-500 text-base">→</span>
                : <span key={i} className={`px-3 py-1.5 rounded-lg text-xs ${item.cls || ''}`}>{item.label}</span>
            )}
          </div>
          <p className="text-center text-green-700/70 text-xs mt-3 font-medium">
            The key never decrypts unless all 5 rules pass.
          </p>
        </div>
      </section>

      {/* 5 Rules */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-orange-500 mb-2">5 Rules. 0 Exceptions.</h2>
            <p className="text-green-800/80 max-w-lg mx-auto text-sm">
              Rules run in order. First failure blocks the transaction — no negotiation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div key={rule.id}
                className={`bg-white/70 border ${rule.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{rule.icon}</span>
                  <div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${rule.badge}`}>{rule.id}</span>
                    <h3 className="text-green-900 font-bold text-sm mt-0.5">{rule.name}</h3>
                  </div>
                </div>
                <p className="text-green-800/75 text-sm leading-relaxed mb-3">{rule.desc}</p>
                <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-green-700 font-mono">{rule.example}</p>
                </div>
              </div>
            ))}
          </div>

          {/* R4 callout */}
          <div className="mt-5 bg-violet-50 border border-violet-200 rounded-2xl p-5 flex gap-4 shadow-sm">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="text-violet-700 font-bold mb-1 text-sm">R4 — Claude reads the agent's intent</h3>
              <p className="text-violet-800/75 text-sm leading-relaxed">
                Rule 4 uses Claude to verify that what an agent <em>says</em> it's doing actually matches what the transaction <em>does</em>.
                Prompt injection at the tool layer becomes irrelevant when the wallet layer catches it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dead Man's Switch */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/70 border border-red-200 rounded-3xl p-8 md:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">Dead Man's Switch</span>
                <h2 className="text-2xl font-black text-orange-500 mt-2 mb-3">Silence = Lockdown</h2>
                <p className="text-green-800/80 text-sm leading-relaxed mb-5">
                  Every agent must heartbeat every 60 seconds. Go silent — crashed, hijacked, or killed —
                  and AgentWall revokes its OWS token and sweeps funds to your recovery wallet. Automatically.
                </p>
                <div className="space-y-2">
                  {[
                    'Agent stops heartbeating',
                    'Dead Man\'s Switch fires after timeout',
                    'OWS token revoked — can never sign again',
                    'Funds swept to recovery wallet',
                    'REVOKED + SWEPT written on-chain',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-red-100 border border-red-200 text-red-500 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                      <span className="text-sm text-green-900">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-green-950 border border-green-800 rounded-2xl p-5 font-mono text-xs space-y-1.5">
                <div className="text-green-600"># firewall logs</div>
                <div className="text-green-400">[PayrollAgent-01] ♥ heartbeat sent</div>
                <div className="text-green-400">[PayrollAgent-01] ♥ heartbeat sent</div>
                <div className="text-green-700">... 5s of silence ...</div>
                <div className="text-red-400">[DeadManSwitch] PayrollAgent-01 went silent</div>
                <div className="text-red-400">[DeadManSwitch] Revoking OWS token...</div>
                <div className="text-amber-400">[Chain] REVOKED logged on-chain</div>
                <div className="text-amber-400">[Chain] SWEPT logged on-chain</div>
                <div className="text-green-600 mt-2"># dashboard shows:</div>
                <div className="text-red-300">☠ REVOKED  PayrollAgent-01</div>
                <div className="text-amber-300">↩ SWEPT    → 0xE8999...024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Per-agent config */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-mono font-bold text-green-700 uppercase tracking-widest">Per-Agent Governance</span>
          <h2 className="text-2xl font-black text-orange-500 mt-2 mb-3">One firewall. Any number of agents.</h2>
          <p className="text-green-800/80 max-w-xl mx-auto text-sm mb-8">
            Each agent gets its own wallet, spend cap, allowlist, and heartbeat timeout. One config file.
          </p>
          <div className="bg-green-950 border border-green-800 rounded-2xl p-6 text-left font-mono text-xs shadow-sm">
            <div className="text-green-600 mb-3"># agentwall.config.json</div>
            <div className="space-y-1 text-green-300">
              <div>{'{'}</div>
              <div className="pl-4 text-green-400">"agents": {'{'}</div>
              <div className="pl-8"><span className="text-amber-400">"TradingAgent-01"</span><span className="text-green-400">: {'{ '}</span><span className="text-sky-400">"spendCapUSDC"</span><span className="text-green-400">: </span><span className="text-orange-400">500</span><span className="text-green-400">, </span><span className="text-sky-400">"allowedChains"</span><span className="text-green-400">: [</span><span className="text-orange-400">"eip155:11155111"</span><span className="text-green-400">] {'}'}</span></div>
              <div className="pl-8"><span className="text-amber-400">"SupportAgent-01"</span><span className="text-green-400">: {'{ '}</span><span className="text-sky-400">"spendCapUSDC"</span><span className="text-green-400">: </span><span className="text-orange-400">100</span><span className="text-green-400">, </span><span className="text-sky-400">"heartbeatTimeoutMs"</span><span className="text-green-400">: </span><span className="text-orange-400">5000</span><span className="text-green-400"> {'}'}</span></div>
              <div className="pl-8"><span className="text-amber-400">"PayrollAgent-01"</span><span className="text-green-400">: {'{ '}</span><span className="text-sky-400">"spendCapUSDC"</span><span className="text-green-400">: </span><span className="text-orange-400">5000</span><span className="text-green-400">, </span><span className="text-sky-400">"owsWallet"</span><span className="text-green-400">: </span><span className="text-orange-400">"payroll-wallet"</span><span className="text-green-400"> {'}'}</span></div>
              <div className="pl-4 text-green-400">{'}'}</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto bg-white/70 border border-green-200 rounded-3xl p-10 shadow-sm">
          <h2 className="text-3xl font-black text-orange-500 mb-3">See it live</h2>
          <p className="text-green-800/80 text-sm mb-8">
            Open the dashboard and run the demo agents. Watch AgentWall intercept, evaluate, block, and revoke — in real time.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href={DASHBOARD}
              className="bg-orange-500 text-white px-7 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors shadow-md text-sm">
              Open Dashboard →
            </Link>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer"
              className="bg-white border border-green-300 text-green-900 px-7 py-3 rounded-full font-bold hover:bg-green-50 transition-colors text-sm">
              View Source ↗
            </a>
          </div>
          <div className="mt-6 font-mono text-xs text-green-600 space-y-1">
            <div>npm run dev:firewall &amp;&amp; npm run dev:dashboard</div>
            <div>npm run dev:agent:multi</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-300/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-green-700/70 font-mono">
            AgentWall · OWS Hackathon Track 02 · Ethereum Sepolia
          </div>
          <div className="flex items-center gap-5 text-xs text-green-700/70">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">GitHub</a>
            <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Contract</a>
            <Link href={DASHBOARD} className="hover:text-orange-500 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
