# AgentWall

**Execution firewall for AI agent wallets — built on Open Wallet Standard**

> Every AI agent with a wallet is one prompt injection away from draining your funds.
> AgentWall is a 5-rule firewall that intercepts every signing request before OWS touches the key.

Built for **OWS Hackathon — Track 02: Agent Spend Governance & Identity**

---

## How It Works

```
AI Agent → POST /api/sign → 5-Rule Firewall → OWS Vault → Ethereum Sepolia
```

Before any transaction is signed, it must pass **all 5 rules**. Any failure = blocked, logged on-chain, dashboard updated in real time.

| Rule | Name | What it checks |
|------|------|----------------|
| R1 | Allowlist | Is the recipient address on the approved list? |
| R2 | Spend Cap | Would this tx exceed the agent's daily spend limit? |
| R3 | Liveness | Has the agent sent a heartbeat recently? (Dead Man's Switch) |
| R4 | Intent | Does Claude verify the tx semantically matches the declared intent? |
| R5 | Anomaly | Is the amount 5x above the agent's historical average? Off-hours to new address? |

**R4 is new** — Claude reads the agent's declared intent and checks if it matches the actual transaction semantically, not just syntactically. Stops prompt injection attacks at the wallet layer.

**Dead Man's Switch** — if an agent goes silent (no heartbeat for 5 min), AgentWall automatically revokes its OWS API token and broadcasts a sweep event to the recovery wallet.

---

## Architecture

```
agentwall/
├── packages/
│   ├── firewall/          # Node.js — Express + WebSocket, 5-rule engine
│   ├── contracts/         # Solidity — on-chain audit log (Ethereum Sepolia)
│   └── mock-agent/        # Node.js — demo agent with 4 attack modes
├── apps/
│   └── dashboard/         # Next.js 14 + Tailwind — live firewall feed
└── .env.example
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Firewall engine | Node.js 20, Express, WebSocket |
| Intent verifier | Anthropic Claude API (`claude-sonnet-4-5`) |
| Wallet | Open Wallet Standard (`@open-wallet-standard/core`) |
| Smart contract | Solidity 0.8.20, Hardhat |
| Chain | Ethereum Sepolia |
| Dashboard | Next.js 14, Tailwind CSS |

---

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, OWS_AGENT_TOKEN, DEPLOYER_PRIVATE_KEY
```

### 3. Set up OWS wallet

```bash
# Install OWS CLI
curl -fsSL https://docs.openwallet.sh/install.sh | bash

# Create wallet and agent key
ows wallet create --name agentwall-demo
ows key create --name TradingBot-01 --wallet agentwall-demo
# → paste token into OWS_AGENT_TOKEN in .env
```

### 4. Deploy audit log contract

```bash
npm run deploy:contract
# → paste printed address into AUDIT_LOG_CONTRACT in .env
```

### 5. Run everything

```bash
# Terminal 1 — firewall
npm run dev:firewall

# Terminal 2 — dashboard (http://localhost:3000)
npm run dev:dashboard

# Terminal 3 — demo agent
npm run dev:agent:normal    # ✅ all rules pass
npm run dev:agent:attack    # ❌ R1 + R4 fail (wrong address + intent mismatch)
npm run dev:agent:dead      # ☠️  agent goes silent → auto-revoke after timeout
```

---

## Demo Scenarios

### Normal payment
Agent sends $50 to known supplier with matching intent → **APPROVED**, OWS signs, on-chain log written.

### Prompt injection attack
Agent is compromised — sends to `0x000...dEaD` but claims it's a supplier payment. R1 blocks (unknown address), R4 blocks (Claude detects intent mismatch) → **BLOCKED**.

### Spend cap overflow
Agent tries to send $9,999 → R2 blocks ($9,999 > $500 cap) → **BLOCKED**.

### Dead Man's Switch
Agent crashes or is hijacked — stops sending heartbeats. After 5 minutes, firewall:
1. Marks agent as **REVOKED**
2. Revokes the OWS API token (key can never sign again)
3. Broadcasts **SWEPT** event to recovery wallet
4. Writes all events to on-chain audit log

---

## On-Chain Audit Log

Contract deployed on Ethereum Sepolia:
`0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341`

View events on Etherscan:
`https://sepolia.etherscan.io/address/0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341#events`

Events emitted:
- `TransactionApproved(agentId, to, value, intent, timestamp)`
- `TransactionBlocked(agentId, to, value, rule, reason, timestamp)`
- `AgentRevoked(agentId, reason, timestamp)`
- `FundsSwept(agentId, to, timestamp)`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for R4 intent verification |
| `OWS_AGENT_TOKEN` | OWS scoped API token for the agent |
| `OWS_WALLET_NAME` | OWS wallet name (default: `agentwall-demo`) |
| `OWS_KEY_ID` | OWS API key UUID (for revocation on dead man's switch) |
| `DEPLOYER_PRIVATE_KEY` | Private key to deploy + call the audit log contract |
| `RECOVERY_WALLET` | Address to sweep funds to on agent revocation |
| `AUDIT_LOG_CONTRACT` | Deployed `AgentWallLog` contract address |
| `SPEND_CAP_USDC` | Per-agent daily spend cap in USD (default: 500) |
| `HEARTBEAT_TIMEOUT_MS` | Dead man's switch timeout in ms (default: 300000) |
| `ALLOWLIST` | Comma-separated approved recipient addresses |

---

## Why AgentWall vs Existing Solutions

| Feature | Aegis Protocol | Raw OWS Policies | AgentWall |
|---------|---------------|-----------------|-----------|
| Allowlist | ✅ | ✅ | ✅ |
| Spend cap | ❌ | partial | ✅ |
| Dead man's switch | ❌ | ❌ | ✅ |
| Semantic intent check (Claude) | ❌ | ❌ | ✅ |
| Anomaly detection | ❌ | ❌ | ✅ |
| On-chain audit log | ❌ | ❌ | ✅ |
| Key never leaves vault | ❌ | ✅ | ✅ (OWS) |
| Live dashboard | ❌ | ❌ | ✅ |

---

## License

MIT
