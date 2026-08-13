/**
 * AI — a free, keyless language model, called straight from the browser.
 *
 * Why this shape:
 *
 * · The provider is an open vLLM endpoint (unturf) serving a Qwen3-class
 *   model. It needs no API key, sets `Access-Control-Allow-Origin: *`, and
 *   is reachable from a page, so nothing has to be proxied and no secret
 *   ever ships to the client.
 *
 * · The model id is discovered at runtime from `/models` rather than
 *   hard-coded: the endpoint has already swapped models once, and pinning
 *   a stale id is the failure that takes the assistant down silently.
 *
 * · Thinking is disabled through `chat_template_kwargs`. Left on, the model
 *   prefixes every answer with its reasoning and then runs out of budget
 *   before reaching the point. Any stray reasoning block is stripped anyway.
 *
 * · Streaming is deliberately not used. The keyless tier rejects streaming
 *   requests, so callers get a single resolved answer and show a typing
 *   indicator while they wait.
 *
 * Two providers considered and rejected, recorded so they are not retried:
 *   g4f.space  — now gated behind proof-of-work "cake credits".
 *   pollinations — anonymous tier rejects any request carrying a system
 *                  message, a long prompt, or a raised max_tokens.
 */

const ENDPOINT = 'https://hermes.ai.unturf.com/v1'
const API_KEY = 'dummy-api-key' // the provider's public placeholder, not a secret
const FALLBACK_MODEL = 'Lorbus/Qwen3.6-27B-int4-AutoRound'
const REQUEST_TIMEOUT_MS = 90_000

let modelPromise = null

/** Resolve the served model id once per page load. */
function resolveModel() {
  modelPromise ??= (async () => {
    try {
      const res = await fetch(`${ENDPOINT}/models`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) throw new Error(`models responded ${res.status}`)
      const body = await res.json()
      const id = body?.data?.[0]?.id
      if (id) return id
      throw new Error('no models listed')
    } catch (err) {
      console.warn('[ai] falling back to the pinned model:', err.message)
      return FALLBACK_MODEL
    }
  })()
  return modelPromise
}

/** Remove reasoning the model may still emit despite thinking being off. */
function stripReasoning(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|?thinking\|?>[\s\S]*?<\/?\|?thinking\|?>/gi, '')
    // Some builds open a plain-prose preamble before the real answer.
    .replace(/^\s*(here'?s? (is )?(a |my )?thinking process|let me think|thinking)[:\s][\s\S]*?(?=\n#{1,4}\s|\n\|)/i, '')
    .trim()
}

export class AIUnavailable extends Error {
  constructor(message) {
    super(message)
    this.name = 'AIUnavailable'
  }
}

/**
 * Ask the model.
 *
 * @param {object}   opts
 * @param {string}   opts.system    Instructions and grounding record.
 * @param {Array}    opts.messages  [{ role: 'user'|'assistant', content }]
 * @param {number}   [opts.maxTokens]
 * @param {number}   [opts.temperature]
 * @returns {Promise<string>} the answer text
 */
export async function generate({
  system,
  messages = [],
  maxTokens = 800,
  temperature = 0.3,
} = {}) {
  const model = await resolveModel()

  const payload = {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: maxTokens,
    temperature,
    stream: false,
    // vLLM passes this to the Qwen chat template; without it the model
    // spends its whole budget reasoning out loud.
    chat_template_kwargs: { enable_thinking: false },
  }

  let res
  try {
    res = await fetch(`${ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new AIUnavailable(
      err.name === 'TimeoutError'
        ? 'The assistant took too long to answer. Try a narrower question.'
        : 'The assistant could not be reached. Check the connection and try again.'
    )
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new AIUnavailable(
      `The assistant refused the request (${res.status}).` +
      (detail ? ` ${detail.slice(0, 160)}` : '')
    )
  }

  const body = await res.json().catch(() => null)
  const raw =
    body?.choices?.[0]?.message?.content ??
    body?.choices?.[0]?.text ??
    ''

  const text = stripReasoning(String(raw))
  if (!text) throw new AIUnavailable('The assistant returned an empty answer.')
  return text
}

/** True when the model endpoint answers — used for status indicators. */
export async function checkAvailability() {
  try {
    await resolveModel()
    return true
  } catch {
    return false
  }
}
