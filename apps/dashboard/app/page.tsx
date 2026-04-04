import Link from 'next/link'

const GITHUB = 'https://github.com/jonumhills/agentwall'
const DASHBOARD = '/dashboard'
const ETHERSCAN = 'https://sepolia.etherscan.io/address/0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341#events'

// #D4622A — the warm burnt-orange from the reference image
const OG = '#D4622A'

const rules = [
  {
    id: 'R1', name: 'Allowlist', icon: '🔐',
    desc: 'Every recipient address is checked against a per-agent approved list. Unknown addresses are blocked instantly.',
    example: 'Burn address → BLOCKED',
  },
  {
    id: 'R2', name: 'Spend Cap', icon: '💰',
    desc: 'Each agent has its own daily spend limit. Transactions that exceed the cap are blocked regardless of other rules.',
    example: '$200 tx, $100 cap → BLOCKED',
  },
  {
    id: 'R3', name: 'Liveness', icon: '♥',
    desc: "Agents must send a heartbeat every 60s. No heartbeat = no signing. Silence triggers Dead Man's Switch.",
    example: 'No heartbeat → REVOKED',
  },
  {
    id: 'R4', name: 'Intent Verification', icon: '🤖',
    desc: "Claude reads the agent's stated intent and verifies it matches the actual transaction — semantically, not syntactically.",
    example: '"Pay supplier" → burn address → BLOCKED',
  },
  {
    id: 'R5', name: 'Anomaly Detection', icon: '📊',
    desc: "Flags amounts 5× above an agent's baseline or off-hours transfers to new recipients.",
    example: 'Usual $50 → sudden $5,000 → BLOCKED',
  },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen font-sans text-gray-100"
      style={{
        backgroundColor: '#0a0f0a',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
      }}
    >

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-[#0a0f0a]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-black tracking-tight text-lg" style={{ color: OG }}>
            AgentWall
          </span>
          <div className="flex items-center gap-4">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors font-medium">GitHub</a>
            <Link href={DASHBOARD}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors shadow-sm"
              style={{ backgroundColor: OG, color: '#fff' }}>
              Live Dashboard →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-gray-900 border border-gray-700 text-gray-400 px-3 py-1.5 rounded-full mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          OWS Hackathon · Track 02 · Agent Spend Governance &amp; Identity
        </div>

        <h1
          className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-4"
          style={{ color: OG, fontFamily: 'system-ui, sans-serif' }}
        >
          AgentWall
        </h1>

        <p className="text-xl sm:text-2xl font-bold text-gray-300 mb-6">
          Execution Firewall for OWS Wallets
        </p>

        <p className="text-base text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Every transaction an AI agent tries to sign passes through 5 rules first.
          Any rule fails — the key never decrypts.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href={DASHBOARD}
            className="font-semibold px-6 py-3 rounded-full transition-colors shadow-md text-white"
            style={{ backgroundColor: OG }}>
            View Live Dashboard →
          </Link>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer"
            className="border border-gray-700 text-gray-300 px-6 py-3 rounded-full font-semibold hover:border-gray-500 hover:text-white transition-colors">
            GitHub ↗
          </a>
          <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer"
            className="border border-gray-700 text-gray-300 px-6 py-3 rounded-full font-semibold hover:border-gray-500 hover:text-white transition-colors">
            On-chain Audit ↗
          </a>
        </div>
      </section>

      {/* Flow diagram */}
      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl px-8 py-8 flex items-center justify-center gap-0 font-mono">

            {/* AI Agent */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-1 shadow-lg">
                <span className="text-2xl">🤖</span>
                <span className="text-xs font-bold text-gray-300">AI Agent</span>
              </div>
              <span className="text-xs text-gray-600 font-mono">POST /api/sign</span>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center px-3 pb-6">
              <div className="flex items-center gap-1 text-gray-600">
                <div className="w-10 h-px bg-gray-700" />
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            {/* AgentWall */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-36 h-24 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-xl ring-2"
                style={{ backgroundColor: OG, boxShadow: `0 0 24px ${OG}55, 0 0 0 2px ${OG}` }}>
                <span className="text-2xl">🛡️</span>
                <span className="text-sm font-black text-white tracking-tight">AgentWall</span>
                <span className="text-xs text-white/70">5 rules</span>
              </div>
              <span className="text-xs font-mono" style={{ color: OG }}>firewall layer</span>
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center px-3 pb-6">
              <div className="flex items-center gap-1 text-gray-600">
                <div className="w-10 h-px bg-gray-700" />
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            {/* OWS Vault */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-20 rounded-2xl bg-green-900 border border-green-700 flex flex-col items-center justify-center gap-1 shadow-lg" style={{ boxShadow: '0 0 16px rgba(34,197,94,0.15)' }}>
                <span className="text-2xl">🔑</span>
                <span className="text-xs font-bold text-green-300">OWS Vault</span>
              </div>
              <span className="text-xs text-green-600 font-mono">signs &amp; executes</span>
            </div>

          </div>
          <p className="text-center text-gray-600 text-xs mt-3 font-medium">
            The key never decrypts unless all 5 rules pass.
          </p>
        </div>
      </section>

      {/* 5 Rules */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">5 Rules. 0 Exceptions.</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm">
              Rules run in order. First failure blocks the transaction — no negotiation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div key={rule.id}
                className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{rule.icon}</span>
                  <div>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: OG }}>
                      {rule.id}
                    </span>
                    <h3 className="text-white font-bold text-sm mt-0.5">{rule.name}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">{rule.desc}</p>
                <div className="bg-gray-950 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 font-mono">{rule.example}</p>
                </div>
              </div>
            ))}
          </div>

          {/* R4 callout */}
          <div className="mt-5 bg-gray-900/80 border rounded-2xl p-5 flex gap-4" style={{ borderColor: OG + '55' }}>
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-bold mb-1 text-sm" style={{ color: OG }}>R4 — Claude reads the agent's intent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
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
          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: OG }}>
                  Dead Man's Switch
                </span>
                <h2 className="text-2xl font-black text-white mt-2 mb-3">Silence = Lockdown</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  Every agent must heartbeat every 60 seconds. Go silent — crashed, hijacked, or killed —
                  and AgentWall revokes its OWS token and sweeps funds to your recovery wallet. Automatically.
                </p>
                <div className="space-y-2">
                  {[
                    'Agent stops heartbeating',
                    "Dead Man's Switch fires after timeout",
                    'OWS token revoked — can never sign again',
                    'Funds swept to recovery wallet',
                    'REVOKED + SWEPT written on-chain',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"
                        style={{ backgroundColor: OG }}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 font-mono text-xs space-y-1.5">
                <div className="text-gray-600"># firewall logs</div>
                <div className="text-green-400">[PayrollAgent-01] ♥ heartbeat sent</div>
                <div className="text-green-400">[PayrollAgent-01] ♥ heartbeat sent</div>
                <div className="text-gray-600">... 5s of silence ...</div>
                <div className="text-red-400">[DeadManSwitch] PayrollAgent-01 went silent</div>
                <div className="text-red-400">[DeadManSwitch] Revoking OWS token...</div>
                <div className="text-amber-400">[Chain] REVOKED logged on-chain</div>
                <div className="text-amber-400">[Chain] SWEPT logged on-chain</div>
                <div className="text-gray-600 mt-2"># dashboard shows:</div>
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
          <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: OG }}>
            Per-Agent Governance
          </span>
          <h2 className="text-2xl font-black text-white mt-2 mb-3">One firewall. Any number of agents.</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm mb-8">
            Each agent gets its own wallet, spend cap, allowlist, and heartbeat timeout. One config file.
          </p>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-left font-mono text-xs">
            <div className="text-gray-600 mb-3"># agentwall.config.json</div>
            <div className="space-y-1 text-gray-300">
              <div>{'{'}</div>
              <div className="pl-4 text-gray-400">"agents": {'{'}</div>
              <div className="pl-8"><span className="text-amber-400">"TradingAgent-01"</span><span className="text-gray-400">: {'{ '}</span><span className="text-sky-400">"spendCapUSDC"</span><span className="text-gray-400">: </span><span style={{ color: OG }}>500</span><span className="text-gray-400">, </span><span className="text-sky-400">"allowedChains"</span><span className="text-gray-400">: [</span><span style={{ color: OG }}>"eip155:11155111"</span><span className="text-gray-400">] {'}'}</span></div>
              <div className="pl-8"><span className="text-amber-400">"SupportAgent-01"</span><span className="text-gray-400">: {'{ '}</span><span className="text-sky-400">"spendCapUSDC"</span><span className="text-gray-400">: </span><span style={{ color: OG }}>100</span><span className="text-gray-400">, </span><span className="text-sky-400">"heartbeatTimeoutMs"</span><span className="text-gray-400">: </span><span style={{ color: OG }}>5000</span><span className="text-gray-400"> {'}'}</span></div>
              <div className="pl-8"><span className="text-amber-400">"PayrollAgent-01"</span><span className="text-gray-400">: {'{ '}</span><span className="text-sky-400">"spendCapUSDC"</span><span className="text-gray-400">: </span><span style={{ color: OG }}>5000</span><span className="text-gray-400">, </span><span className="text-sky-400">"owsWallet"</span><span className="text-gray-400">: </span><span style={{ color: OG }}>"payroll-wallet"</span><span className="text-gray-400"> {'}'}</span></div>
              <div className="pl-4 text-gray-400">{'}'}</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto bg-gray-900/80 border border-gray-800 rounded-3xl p-10">
          <h2 className="text-3xl font-black text-white mb-3">See it live</h2>
          <p className="text-gray-400 text-sm mb-8">
            Open the dashboard and run the demo agents. Watch AgentWall intercept, evaluate, block, and revoke — in real time.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href={DASHBOARD}
              className="font-bold px-7 py-3 rounded-full transition-colors shadow-md text-sm text-white"
              style={{ backgroundColor: OG }}>
              Open Dashboard →
            </Link>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer"
              className="border border-gray-700 text-gray-300 px-7 py-3 rounded-full font-bold hover:border-gray-500 hover:text-white transition-colors text-sm">
              View Source ↗
            </a>
          </div>
          <div className="mt-6 font-mono text-xs text-gray-600 space-y-1">
            <div>npm run dev:firewall &amp;&amp; npm run dev:dashboard</div>
            <div>npm run dev:agent:multi</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs font-bold" style={{ color: OG }}>
            AgentWall · OWS Hackathon Track 02 · Ethereum Sepolia
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">GitHub</a>
            <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Contract</a>
            <Link href={DASHBOARD} className="hover:text-gray-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
