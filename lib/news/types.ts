export const TOPICS = ['hyperscalers', 'agentic', 'quantum'] as const
export type Topic = (typeof TOPICS)[number]

export const TOPIC_LABEL: Record<Topic, string> = {
  hyperscalers: 'HYPERSCALERS',
  agentic: 'AGENTIC AI',
  quantum: 'QUANTUM COMPUTING',
}

export interface NewsItem {
  topic: Topic
  headline: string
  summary: string
  url: string
  source: string
  publishedAt: string | null
}

export interface NewsPayload {
  items: NewsItem[]
  fetchedAt: string
  stale: boolean
}
