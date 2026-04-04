# AgentWall — Firewall on OpenWallet

Every transaction an AI agent tries to sign must pass through AgentWall first. Any rule fails the key never decrypts.

---

## Architecture

![Dashboard](assets/Architecture.png)
---

## Policies

| Rule | Name | What it checks |
|------|------|----------------|
| R1 | **Allowlist** | Recipient address must be on the agent's approved list |
| R2 | **Spend Cap** | Transaction must not exceed the agent's daily USDC limit |
| R3 | **Liveness** | Agent must have sent a heartbeat recently (Dead Man's Switch) |
| R4 | **Intent Verification** | Claude verifies the stated intent matches the actual transaction |
| R5 | **Anomaly Detection** | Flags amounts 5× above baseline or off-hours transfers to new addresses |

Each agent is configured independently in `agentwall.config.json`:

```json
{
  "agents": {
    "TradingAgent-01": { "spendCapUSDC": 500, "allowedChains": ["eip155:11155111"] },
    "SupportAgent-01": { "spendCapUSDC": 100, "heartbeatTimeoutMs": 5000 },
    "PayrollAgent-01": { "spendCapUSDC": 5000, "owsWallet": "payroll-wallet" }
  }
}
```

---

## Demo

▶ [Watch the demo](https://youtu.be/wrYmxwSPIMQ)

🐦 [X post](https://x.com/Jonumhills_/status/2040315599985754408?s=20)

🔗 [On-chain audit log — Ethereum Sepolia](https://sepolia.etherscan.io/address/0x26be9840C28B8b4FE5c4CdF7c0367B03dF6cB341#events)


---

## Sequence diagram

```mermaid
sequenceDiagram
    autonumber
    participant Agent as AI Mock Agent
    participant AW as AgentWall (Node.js)
    participant Claude as Anthropic Claude API
    participant OWS as OWS Vault (API)
    participant Chain as Ethereum Sepolia
    participant DB as Dashboard (Next.js)

    box rgb(30, 30, 30) Firewall Logic
        participant AW
    end

    alt Dead Man's Switch (Parallel Process)
        Agent-xAW: [No Heartbeat for 5s]
        Note over AW: Timeout triggered
        par Security Actions
            AW->>OWS: Revoke OWS_KEY_ID
            AW->>Chain: Call AgentWallLog.revoked()
            AW->>DB: WS Update: STATUS REVOKED
        and Sweep Funds
            AW->>Chain: Sweep funds to RECOVERY_WALLET
        end
    end

    Note over Agent, Chain: Transaction Attempt Flow

    Agent->>AW: POST /api/sign (payload)

    Note over AW: Rule Engine Start

    alt Static Rules Fail (R1 / R2)
        AW->>DB: WS Update: BLOCKED (Allowlist or Cap)
        AW->>Chain: Call log.blocked(R1, reason)
        AW-->>Agent: 403 Forbidden
    else Static Rules Pass
        AW->>Claude: (R4) Verify Semantic Intent

        alt Intent Mismatch
            Claude-->>AW: Mismatch detected
            AW->>DB: WS Update: BLOCKED (Intent Mismatch)
            AW->>Chain: Call log.blocked(R4, reason)
            AW-->>Agent: 403 Forbidden
        else Intent Match
            Claude-->>AW: Match confirmed
            Note over AW: R3 (Liveness) and R5 (Anomaly) Check

            alt All Rules Pass
                AW->>OWS: Request Signature
                OWS-->>AW: Signed Tx
                AW->>Chain: Broadcast
                par Audit
                    AW->>Chain: Call log.approved()
                    AW->>DB: WS Update: SIGNED
                end
                AW-->>Agent: 200 OK (TxHash)
            end
        end
    end
```

---

## Run locally

```bash
# 1. Start the firewall
npm run dev:firewall

# 2. Start the dashboard
npm run dev:dashboard

# 3. Run the 4-agent demo
npm run dev:agent:multi
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the live firewall dashboard.

---

*OWS Hackathon · Track 02 · Agent Spend Governance & Identity*


