import Link from 'next/link'

const GITHUB = 'https://github.com/jonumhills/agentwall'
const DASHBOARD = '/dashboard'
const ETHERSCAN = 'https://sepolia.etherscan.io/address/0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341#events'

const rules = [
  {
    id: 'R1',
    name: 'Allowlist',
    icon: '🔐',
    color: 'from-blue-600 to-blue-800',
    border: 'border-blue-800',
    text: 'text-blue-400',
    desc: 'Every recipient address is checked against a per-agent approved list. Unknown addresses are blocked before anything else runs.',
    example: 'AttackAgent sends to burn address → BLOCKED immediately',
  },
  {
    id: 'R2',
    name: 'Spend Cap',
    icon: '💰',
    color: 'from-emerald-600 to-emerald-800',
    border: 'border-emerald-800',
    text: 'text-emerald-400',
    desc: "Each agent has its own daily spend limit. Transactions that would push the agent over its cap are blocked — even if everything else looks fine.",
    example: 'SupportAgent ($100 cap) tries $200 → BLOCKED by R2',
  },
  {
    id: 'R3',
    name: 'Liveness',
    icon: '♥',
    color: 'from-rose-600 to-rose-800',
    border: 'border-rose-800',
    text: 'text-rose-400',
    desc: 'Agents must send a heartbeat every 60s to prove they are alive and under control. No heartbeat = no signing. Goes silent long enough = auto-revoked.',
    example: 'PayrollAgent stops heartbeating → REVOKED + funds swept',
  },
  {
    id: 'R4',
    name: 'Intent Verification',
    icon: '🤖',
    color: 'from-violet-600 to-violet-800',
    border: 'border-violet-800',
    text: 'text-violet-400',
    desc: "Claude reads the agent's declared intent and checks if it semantically matches the actual transaction. Stops prompt injection at the wallet layer — not the tool layer.",
    example: '"Pay supplier" but tx goes to burn address → Claude detects mismatch → BLOCKED',
  },
  {
    id: 'R5',
    name: 'Anomaly Detection',
    icon: '📊',
    color: 'from-amber-600 to-amber-800',
    border: 'border-amber-800',
    text: 'text-amber-400',
    desc: 'Compares each transaction against the agent\'s historical baseline. Flags amounts that are 5× above average or off-hours transactions to new recipients.',
    example: 'Agent that usually sends $50 suddenly sends $5,000 → BLOCKED',
  },
]

const timeline = [
  { step: '01', label: 'Agent declares intent', desc: 'Agent sends POST /api/sign with tx details + natural language intent' },
  { step: '02', label: 'AgentWall intercepts', desc: '5 rules run in sequence — live results stream to the dashboard' },
  { step: '03', label: 'Pass or Block', desc: 'All 5 pass → OWS signs with the agent\'s scoped token. Any fail → blocked, logged on-chain' },
  { step: '04', label: 'On-chain audit', desc: 'Every decision is written to the AgentWallLog contract on Ethereum Sepolia' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold text-white tracking-tight">AgentWall</span>
          <div className="flex items-center gap-6">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors">GitHub</a>
            <Link href={DASHBOARD}
              className="text-sm bg-white text-gray-950 px-4 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">
              Live Dashboard →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-violet-950 border border-violet-800 text-violet-300 px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          OWS Hackathon · Track 02 · Agent Spend Governance &amp; Identity
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight leading-none mb-6">
          Your AI agents have<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-rose-400">
            wallets.
          </span>
          <br />Who's watching them?
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          AgentWall is a 5-rule execution firewall built on the Open Wallet Standard.
          Every transaction an AI agent tries to sign passes through AgentWall first.
          Any rule fails — the key never decrypts.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href={DASHBOARD}
            className="bg-white text-gray-950 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            View Live Dashboard →
          </Link>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer"
            className="border border-gray-700 text-gray-300 px-6 py-3 rounded-full font-semibold hover:border-gray-500 hover:text-white transition-colors">
            GitHub ↗
          </a>
          <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer"
            className="border border-gray-700 text-gray-300 px-6 py-3 rounded-full font-semibold hover:border-gray-500 hover:text-white transition-colors">
            On-chain Audit Log ↗
          </a>
        </div>
      </section>

      {/* Flow diagram */}
      <section className="py-16 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm font-mono">
            {[
              { label: 'AI Agent', bg: 'bg-gray-800', text: 'text-gray-300' },
              { label: '→', bg: '', text: 'text-gray-600' },
              { label: 'POST /api/sign', bg: 'bg-gray-800', text: 'text-gray-300' },
              { label: '→', bg: '', text: 'text-gray-600' },
              { label: 'AgentWall', bg: 'bg-violet-900 border border-violet-700', text: 'text-violet-300 font-bold' },
              { label: '→', bg: '', text: 'text-gray-600' },
              { label: '5 Rules', bg: 'bg-gray-800', text: 'text-gray-300' },
              { label: '→', bg: '', text: 'text-gray-600' },
              { label: 'OWS Vault', bg: 'bg-emerald-900 border border-emerald-700', text: 'text-emerald-300' },
              { label: '→', bg: '', text: 'text-gray-600' },
              { label: 'Ethereum', bg: 'bg-gray-800', text: 'text-gray-300' },
            ].map((item, i) => (
              item.label === '→'
                ? <span key={i} className="text-gray-600 text-lg">→</span>
                : <span key={i} className={`px-3 py-2 rounded-lg text-xs ${item.bg} ${item.text}`}>{item.label}</span>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            The key never decrypts unless all 5 rules pass. OWS never sees the request unless AgentWall approves it.
          </p>
        </div>
      </section>

      {/* 5 Rules */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">5 Rules. 0 Exceptions.</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every signing request passes through all five rules in order.
              The first failure blocks the transaction — no negotiation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule, i) => (
              <div key={rule.id} className={`bg-gray-900 border ${rule.border} rounded-2xl p-6 ${i === 3 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rule.color} flex items-center justify-center text-lg`}>
                    {rule.icon}
                  </div>
                  <div>
                    <span className={`text-xs font-mono font-bold ${rule.text}`}>{rule.id}</span>
                    <h3 className="text-white font-semibold text-sm">{rule.name}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{rule.desc}</p>
                <div className="bg-gray-950 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 font-mono">{rule.example}</p>
                </div>
              </div>
            ))}
          </div>

          {/* R4 callout */}
          <div className="mt-6 bg-violet-950/50 border border-violet-800 rounded-2xl p-6 flex gap-4">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="text-violet-300 font-semibold mb-1">R4 is new — Claude reads the agent's mind</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Existing agent safety tools stop malicious <span className="font-mono text-gray-300">DROP TABLE</span> commands.
                AgentWall stops wallet drains. Rule 4 uses Claude to verify that what an agent <em>says</em> it's doing
                actually matches what the transaction <em>does</em> — semantically, not syntactically.
                Prompt injection at the tool layer becomes irrelevant when the wallet layer catches it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dead Man's Switch */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs text-rose-400 font-mono font-bold uppercase tracking-widest mb-4">Dead Man's Switch</div>
              <h2 className="text-3xl font-bold text-white mb-4">Silence = Lockdown</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Every agent must send a heartbeat every 60 seconds.
                If an agent goes silent — crashed, hijacked, or killed —
                AgentWall automatically revokes its OWS API token and
                broadcasts a sweep event to your recovery wallet.
                No human needed. No delay.
              </p>
              <div className="space-y-3">
                {[
                  'Agent stops heartbeating',
                  'Dead Man\'s Switch fires after timeout',
                  'OWS token revoked — agent can never sign again',
                  'Funds swept to recovery wallet',
                  'REVOKED + SWEPT written to on-chain audit log',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-900 border border-rose-700 text-rose-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 font-mono text-xs space-y-2">
              <div className="text-gray-600"># firewall logs</div>
              <div className="text-gray-400">[PayrollAgent-01] ♥ heartbeat sent</div>
              <div className="text-gray-400">[PayrollAgent-01] ♥ heartbeat sent</div>
              <div className="text-gray-600">... 5 seconds of silence ...</div>
              <div className="text-rose-400">[DeadManSwitch] PayrollAgent-01 went silent</div>
              <div className="text-rose-400">[DeadManSwitch] Revoking OWS token...</div>
              <div className="text-amber-400">[Chain] REVOKED logged on-chain</div>
              <div className="text-amber-400">[Chain] SWEPT logged on-chain</div>
              <div className="text-gray-600"># dashboard shows:</div>
              <div className="text-rose-300">☠ REVOKED  PayrollAgent-01</div>
              <div className="text-amber-300">↩ SWEPT    → 0xE8999...024</div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-agent */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-widest mb-4">Per-Agent Governance</div>
          <h2 className="text-3xl font-bold text-white mb-4">One firewall. Any number of agents.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Each agent gets its own OWS wallet, spend cap, allowlist, and heartbeat timeout.
            Revoking one agent never affects the others. One config file — that's all it takes.
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left font-mono text-xs">
            <div className="text-gray-500 mb-3"># agentwall.config.json</div>
            <div className="space-y-1">
              <div className="text-gray-400">{'{'}</div>
              <div className="text-gray-400 pl-4">"agents": {'{'}</div>
              <div className="pl-8">
                <span className="text-emerald-400">"TradingAgent-01"</span>
                <span className="text-gray-400">: {'{ '}</span>
                <span className="text-blue-400">"spendCapUSDC"</span>
                <span className="text-gray-400">: </span>
                <span className="text-amber-400">500</span>
                <span className="text-gray-400">, </span>
                <span className="text-blue-400">"owsWallet"</span>
                <span className="text-gray-400">: </span>
                <span className="text-amber-400">"trading-wallet"</span>
                <span className="text-gray-400"> {'}'}</span>
              </div>
              <div className="pl-8">
                <span className="text-rose-400">"SupportAgent-01"</span>
                <span className="text-gray-400">: {'{ '}</span>
                <span className="text-blue-400">"spendCapUSDC"</span>
                <span className="text-gray-400">: </span>
                <span className="text-amber-400">100</span>
                <span className="text-gray-400">, </span>
                <span className="text-blue-400">"owsWallet"</span>
                <span className="text-gray-400">: </span>
                <span className="text-amber-400">"support-wallet"</span>
                <span className="text-gray-400"> {'}'}</span>
              </div>
              <div className="pl-8">
                <span className="text-violet-400">"PayrollAgent-01"</span>
                <span className="text-gray-400">: {'{ '}</span>
                <span className="text-blue-400">"spendCapUSDC"</span>
                <span className="text-gray-400">: </span>
                <span className="text-amber-400">5000</span>
                <span className="text-gray-400">, </span>
                <span className="text-blue-400">"owsWallet"</span>
                <span className="text-gray-400">: </span>
                <span className="text-amber-400">"payroll-wallet"</span>
                <span className="text-gray-400"> {'}'}</span>
              </div>
              <div className="text-gray-400 pl-4">{'}'}</div>
              <div className="text-gray-400">{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works timeline */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How a transaction flows</h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-800" />
            <div className="space-y-8">
              {timeline.map((item) => (
                <div key={item.step} className="flex gap-6 relative">
                  <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-xs font-mono font-bold text-gray-400">{item.step}</span>
                  </div>
                  <div className="pt-1.5 pb-8">
                    <h3 className="text-white font-semibold mb-1">{item.label}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OWS integration */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest mb-4">Built on OWS</div>
          <h2 className="text-3xl font-bold text-white mb-4">The key never leaves the vault</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            AgentWall sits in front of OWS — not inside it. Agents never hold keys.
            OWS handles encryption, signing, and key isolation.
            AgentWall handles who gets to ask OWS to sign.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Scoped Tokens', desc: 'Each agent gets its own OWS API token — scoped to its wallet only. Revoke one without touching others.' },
              { title: 'Key Isolation', desc: 'Private keys are decrypted only after all 5 rules pass. Fail any rule and the key is never touched.' },
              { title: 'On-Chain Proof', desc: 'Every APPROVED, BLOCKED, REVOKED and SWEPT event is written to the AgentWallLog contract on Ethereum Sepolia.' },
            ].map(item => (
              <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left">
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            See it live
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Open the dashboard and run the demo agents to watch AgentWall intercept,
            evaluate, block, and revoke — all in real time.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href={DASHBOARD}
              className="bg-white text-gray-950 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg">
              Open Dashboard →
            </Link>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer"
              className="border border-gray-700 text-gray-300 px-8 py-3 rounded-full font-semibold hover:border-gray-500 hover:text-white transition-colors text-lg">
              View Source ↗
            </a>
          </div>
          <div className="mt-8 font-mono text-xs text-gray-600 space-y-1">
            <div>npm run dev:firewall &amp;&amp; npm run dev:dashboard</div>
            <div>npm run dev:agent:multi</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 font-mono">
            AgentWall · OWS Hackathon Track 02 · Ethereum Sepolia
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">GitHub</a>
            <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Contract</a>
            <Link href={DASHBOARD} className="hover:text-gray-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
