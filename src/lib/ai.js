/**
 * AI — a free, keyless language model, called straight from the browser.
 *
 * Providers are tried in order and the first that answers wins. Nothing is
 * configured and no key ships to the client; the chain simply adapts to
 * whatever each provider currently allows.
 *
 *   1. g4f          The widest aggregator and the fastest when it answers.
 *                  It is NOT Cloudflare-blocked from here — `/v1/models`
 *                  returns 200 — but chat now requires proof-of-work
 *                  "cake credits", which no public module bakes; the
 *                  baker lives inside the g4f.dev/chat page. A browser
 *                  that has earned credits there carries them, so it is
 *                  tried first and simply falls through when it has none.
 *   2. pollinations Fast (~1s). Its anonymous tier is gated, and the gate
 *                  may depend on the caller: server-side probes show a
 *                  bare user message with max_tokens <= 10 answering
 *                  while max_tokens 16, any system message, or a longer
 *                  prompt return 401. Browsers present a real Origin and
 *                  may be treated differently, so the response decides.
 *   3. unturf      Open vLLM serving a Qwen3-class model. No key, no
 *                  gate, `Access-Control-Allow-Origin: *`. Slower (~10s)
 *                  but dependable, so it anchors the chain.
 *
 * Nothing above is configured and no key ships to the client. The order is
 * fastest-first; whichever provider is actually open to this visitor wins.
 *
 * Notes that cost time to learn, kept so they are not relearned:
 *
 * · unturf's model id is discovered from `/models`. It has already changed
 *   once (Hermes-3-8B → Qwen3.6-27B); a pinned id fails silently.
 * · `chat_template_kwargs.enable_thinking = false` is required. Without it
 *   the model narrates its reasoning and is cut off before the answer.
 * · Streaming is refused by the keyless tiers, so callers resolve one
 *   complete answer and show a typing indicator meanwhile.
 * · unturf's context window is 65,536 tokens, measured. Oversized
 *   grounding is trimmed rather than sent and rejected.
 */

const REQUEST_TIMEOUT_MS = 180_000

const POLLINATIONS = {
  name: 'pollinations',
  endpoint: 'https://gen.pollinations.ai/v1',
  key: import.meta.env.VITE_POLLINATIONS_KEY || '',
  model: import.meta.env.VITE_POLLINATIONS_MODEL || 'openai',
  discoverModel: false,
  // This provider ignores the vLLM-specific template switch.
  sendThinkingSwitch: false,
}

const UNTURF = {
  name: 'unturf',
  endpoint: 'https://hermes.ai.unturf.com/v1',
  key: 'dummy-api-key', // the provider's public placeholder, not a secret
  model: 'Lorbus/Qwen3.6-27B-int4-AutoRound',
  discoverModel: true,
  sendThinkingSwitch: true,
}

const G4F = {
  name: 'g4f',
  endpoint: 'https://g4f.space/v1',
  key: '',
  // 'auto' lets the aggregator route server-side. Plain aliases such as
  // 'gpt-4o' 404 here; a pinned model needs its full `srv_<id>:<model>` form.
  model: import.meta.env.VITE_G4F_MODEL || 'auto',
  discoverModel: false,
  sendThinkingSwitch: false,
  credentials: 'include', // carry any cake credits the browser has earned
}

const PROVIDERS = [G4F, POLLINATIONS, UNTURF]

/** Name of the provider that answered most recently — for status lines. */
export let lastProvider = null

export const CONTEXT_TOKEN_LIMIT = 65_536
const GROUNDING_TOKEN_BUDGET = 40_000
const CHARS_PER_TOKEN = 3.5

export function estimateTokens(text) {
  return Math.ceil(String(text || '').length / CHARS_PER_TOKEN)
}

/**
 * Trim a grounding record to fit the budget, cutting whole lines from the
 * end and saying so, rather than slicing mid-fact and leaving the model to
 * quote half a figure.
 */
export function fitGrounding(text, budget = GROUNDING_TOKEN_BUDGET) {
  if (estimateTokens(text) <= budget) return text
  const lines = String(text).split('\n')
  const kept = []
  let used = 0
  for (const line of lines) {
    const cost = estimateTokens(line) + 1
    if (used + cost > budget) break
    kept.push(line)
    used += cost
  }
  const dropped = lines.length - kept.length
  kept.push('', `[Record truncated: ${dropped} further lines omitted to fit the model's context.]`)
  return kept.join('\n')
}

const modelCache = new Map()

/** Resolve a provider's model id, discovering it when the provider allows. */
async function resolveModel(provider) {
  if (!provider.discoverModel) return provider.model
  if (modelCache.has(provider.name)) return modelCache.get(provider.name)

  const promise = (async () => {
    try {
      const res = await fetch(`${provider.endpoint}/models`, {
        headers: { Authorization: `Bearer ${provider.key}` },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) throw new Error(`models responded ${res.status}`)
      const id = (await res.json())?.data?.[0]?.id
      if (id) return id
      throw new Error('no models listed')
    } catch (err) {
      console.warn(`[ai] ${provider.name}: using pinned model (${err.message})`)
      return provider.model
    }
  })()

  modelCache.set(provider.name, promise)
  return promise
}

/** Remove reasoning the model may still emit despite thinking being off. */
function stripReasoning(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|?thinking\|?>[\s\S]*?<\/?\|?thinking\|?>/gi, '')
    .replace(/^\s*(here'?s? (is )?(a |my )?thinking process|let me think|thinking)[:\s][\s\S]*?(?=\n#{1,4}\s|\n\|)/i, '')
    .trim()
}

export class AIUnavailable extends Error {
  constructor(message) {
    super(message)
    this.name = 'AIUnavailable'
  }
}

/** One attempt against one provider. Throws so the chain can move on. */
async function callProvider(provider, { system, messages, maxTokens, temperature, tools }) {
  const model = await resolveModel(provider)

  const payload = {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: fitGrounding(system) }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: maxTokens,
    temperature,
    stream: false,
    ...(provider.sendThinkingSwitch
      ? { chat_template_kwargs: { enable_thinking: false } }
      : {}),
    ...(tools ? { tools, tool_choice: 'auto' } : {}),
  }

  const headers = { 'Content-Type': 'application/json' }
  if (provider.key) headers.Authorization = `Bearer ${provider.key}`

  const res = await fetch(`${provider.endpoint}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...(provider.credentials ? { credentials: provider.credentials } : {}),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${provider.name} ${res.status}: ${detail.slice(0, 120)}`)
  }

  const body = await res.json().catch(() => null)

  // Some aggregators report refusals as a 200 with an error body, and some
  // return an empty 200 when the upstream provider is broken. Both must
  // fall through to the next provider rather than surface as an answer.
  if (body?.error) {
    throw new Error(`${provider.name}: ${String(body.error.message || body.error).slice(0, 120)}`)
  }

  const choice = body?.choices?.[0]
  if (!choice) throw new Error(`${provider.name}: malformed or empty response`)

  // A provider that returns nothing useful should not end the chain.
  if (!tools) {
    const text = stripReasoning(String(choice?.message?.content ?? choice?.text ?? ''))
    if (!text) throw new Error(`${provider.name}: empty answer`)
    return { choice, text }
  }
  return { choice, text: '' }
}

/**
 * Ask the model.
 *
 * @param {object} opts
 * @param {string} opts.system      Instructions and grounding record.
 * @param {Array}  opts.messages    [{ role: 'user'|'assistant', content }]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {Array}  [opts.tools]     OpenAI tool definitions; when passed the
 *                                  raw choice is returned so the caller can
 *                                  act on `tool_calls`.
 * @returns {Promise<string|object>} answer text, or the raw choice with tools
 */
export async function generate({
  system,
  messages = [],
  maxTokens = 800,
  temperature = 0.3,
  tools,
} = {}) {
  const failures = []

  for (const provider of PROVIDERS) {
    try {
      const { choice, text } = await callProvider(provider, {
        system, messages, maxTokens, temperature, tools,
      })
      lastProvider = provider.name
      return tools ? choice : text
    } catch (err) {
      failures.push(`${provider.name}: ${err.message}`)
      console.warn(`[ai] ${provider.name} declined, trying the next provider —`, err.message)
    }
  }

  console.error('[ai] every provider failed:', failures)
  throw new AIUnavailable(
    'The assistant could not be reached. Check the connection and try again.'
  )
}

/** True when at least one provider answers — used for status indicators. */
export async function checkAvailability() {
  try {
    await generate({ messages: [{ role: 'user', content: 'ok' }], maxTokens: 5 })
    return true
  } catch {
    return false
  }
}
