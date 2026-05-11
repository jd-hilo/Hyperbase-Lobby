import { NewsItem, TOPICS, Topic } from './types'

const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions'
const MODEL = 'sonar-pro'

// Aim for ~8 items total across 3 topics: 3 + 3 + 2 (last one truncated downstream).
const ITEMS_PER_TOPIC = 3

const TOPIC_PROMPT: Record<Topic, string> = {
  hyperscalers:
    'Latest important news on hyperscaler cloud providers (AWS, Microsoft Azure, Google Cloud, Oracle Cloud): datacenter buildouts, AI infrastructure capex, power and grid deals, custom silicon, major outages or strategic announcements. Last 3 days only — reject anything older.',
  agentic:
    'Latest important news on agentic AI: autonomous AI agents, agent frameworks, multi-agent systems, computer-use agents, agent platforms from OpenAI / Anthropic / Google / Meta / startups. Last 3 days only — reject anything older.',
  quantum:
    'Latest important news on quantum computing: hardware milestones, qubit counts, error correction breakthroughs, quantum advantage results, funding rounds, commercial deals. Last 3 days only — reject anything older.',
}

interface PerplexitySearchResult {
  title?: string
  url?: string
  snippet?: string
  source?: string
  date?: string
}

interface PerplexityResponse {
  choices: Array<{ message: { content: string } }>
  citations?: string[]
  search_results?: PerplexitySearchResult[]
}

interface ModelItem {
  headline: string
  summary: string
  url: string
  source?: string
  published_at?: string | null
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          summary: { type: 'string' },
          url: { type: 'string' },
          source: { type: 'string' },
          published_at: { type: 'string' },
        },
        required: ['headline', 'summary', 'url'],
      },
    },
  },
  required: ['items'],
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toUpperCase()
  } catch {
    return ''
  }
}

function pickBestUrl(
  modelUrl: string,
  searchResults: PerplexitySearchResult[] | undefined,
  citations: string[] | undefined,
): { url: string; source: string } {
  const candidates = [
    ...(searchResults ?? []).map((r) => r.url).filter((u): u is string => !!u),
    ...(citations ?? []),
  ]
  let chosen = modelUrl
  try {
    new URL(modelUrl)
    if (!candidates.includes(modelUrl) && candidates.length > 0) {
      chosen = candidates[0]
    }
  } catch {
    chosen = candidates[0] ?? modelUrl
  }
  const match = (searchResults ?? []).find((r) => r.url === chosen)
  const source = match?.source || match?.title || extractDomain(chosen)
  return { url: chosen, source: source || extractDomain(chosen) }
}

function afterDate(daysAgo: number): string {
  // Perplexity wants MM/DD/YYYY
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getUTCFullYear()}`
}

async function fetchOneTopic(topic: Topic, apiKey: string, maxAgeDays: number): Promise<NewsItem[]> {
  const body = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a news editor for a lobby display at an AI infrastructure company. Return the ${ITEMS_PER_TOPIC} most newsworthy distinct items published in the LAST ${maxAgeDays} DAYS — reject anything older. Respond ONLY as JSON matching the schema: {items: [{headline, summary, url, source, published_at}]}. published_at must be an ISO date within the last ${maxAgeDays} days. Each headline: under 12 words, no clickbait, no trailing period. Each summary: 2 short sentences, under 280 chars total, plain language, no marketing fluff. URLs must be canonical source article URLs and must be distinct from each other.`,
      },
      { role: 'user', content: TOPIC_PROMPT[topic] },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { schema: RESPONSE_SCHEMA },
    },
    search_after_date_filter: afterDate(maxAgeDays),
    temperature: 0.2,
  }

  const res = await fetch(PERPLEXITY_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Perplexity ${res.status} for ${topic}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as PerplexityResponse
  const content = data.choices?.[0]?.message?.content?.trim() ?? ''
  let parsed: { items: ModelItem[] }
  try {
    parsed = JSON.parse(content) as { items: ModelItem[] }
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) return []
    parsed = JSON.parse(m[0]) as { items: ModelItem[] }
  }

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  const out: NewsItem[] = []
  const seen = new Set<string>()
  for (const raw of parsed.items ?? []) {
    if (!raw.headline || !raw.summary || !raw.url) continue
    const { url, source } = pickBestUrl(raw.url, data.search_results, data.citations)
    if (seen.has(url)) continue

    // Drop items older than the requested window when we have a parseable date.
    if (raw.published_at) {
      const t = Date.parse(raw.published_at)
      if (!Number.isNaN(t) && t < cutoff) continue
    }

    seen.add(url)
    out.push({
      topic,
      headline: raw.headline.trim(),
      summary: raw.summary.trim(),
      url,
      source: (raw.source || source || extractDomain(url)).toUpperCase(),
      publishedAt: raw.published_at ?? null,
    })
  }
  return out
}

const TARGET_TOTAL = 8
const MAX_AGE_DAYS = 6

export async function fetchAllTopics(apiKey: string): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    TOPICS.map((topic) => fetchOneTopic(topic, apiKey, MAX_AGE_DAYS)),
  )
  const perTopic: NewsItem[][] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    console.error(`[the-nook] ${TOPICS[i]} fetch failed:`, r.reason)
    return []
  })

  // Round-robin interleave across topics, cap at TARGET_TOTAL.
  const out: NewsItem[] = []
  const cursors = perTopic.map(() => 0)
  while (out.length < TARGET_TOTAL) {
    let added = false
    for (let i = 0; i < perTopic.length && out.length < TARGET_TOTAL; i++) {
      const c = cursors[i]
      if (c < perTopic[i].length) {
        out.push(perTopic[i][c])
        cursors[i] = c + 1
        added = true
      }
    }
    if (!added) break
  }
  return out
}
