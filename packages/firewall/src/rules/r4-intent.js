import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

export async function checkIntent(intent, tx) {
  try {
    const prompt = `You are a blockchain transaction safety checker.

An AI agent declared this intent: "${intent}"

The actual transaction is:
- To: ${tx.to}
- Value: ${tx.value} (in native units)
- Chain: ${tx.chain}

Does this transaction semantically match the declared intent?
Consider: Does the recipient make sense for the stated purpose? Is the amount reasonable?

Respond with EXACTLY one of:
PASS: <one sentence reason>
BLOCK: <one sentence reason>

Do not include anything else.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].text.trim()
    const pass = text.startsWith('PASS')
    const reason = text.replace(/^(PASS|BLOCK):\s*/, '')

    return { pass, reason, raw: text }
  } catch (err) {
    // Fail open on API error — don't block legitimate txs due to API downtime
    console.error('[R4] Claude API error:', err.message)
    return { pass: true, reason: 'Intent check skipped (API error) — proceeding with caution' }
  }
}
