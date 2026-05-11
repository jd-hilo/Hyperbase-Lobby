import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { fetchAllTopics } from '@/lib/news/perplexity'
import type { NewsPayload } from '@/lib/news/types'

export const dynamic = 'force-dynamic'

const CACHE_PATH = path.join(process.cwd(), '.next', 'cache', 'the-nook-last-good.json')

// Returns a stable YYYY-MM-DD bucket key in America/Chicago, where the day
// rolls over at 9:00 AM Central. Before 9am CT, we're still on yesterday's bucket.
function currentBucketKey(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(now)
  const year = parts.find((p) => p.type === 'year')!.value
  const month = parts.find((p) => p.type === 'month')!.value
  const day = parts.find((p) => p.type === 'day')!.value
  const hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10)

  const todayKey = `${year}-${month}-${day}`
  if (hour >= 9) return todayKey
  const d = new Date(`${todayKey}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

interface CachedPayload extends NewsPayload {
  bucketKey: string
}

async function readLastGood(): Promise<CachedPayload | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8')
    return JSON.parse(raw) as CachedPayload
  } catch {
    return null
  }
}

async function writeLastGood(payload: CachedPayload): Promise<void> {
  try {
    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true })
    await fs.writeFile(CACHE_PATH, JSON.stringify(payload), 'utf8')
  } catch (err) {
    console.error('[the-nook] failed to write last-good cache:', err)
  }
}

export async function GET(req: Request) {
  const bucketKey = currentBucketKey()
  const cached = await readLastGood()
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1'

  if (!forceRefresh && cached && cached.bucketKey === bucketKey && cached.items.length > 0) {
    return NextResponse.json({
      items: cached.items,
      fetchedAt: cached.fetchedAt,
      stale: false,
    } satisfies NewsPayload)
  }

  const apiKey = process.env.PERPLEXITY_AUXDEV2 ?? process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    if (cached) {
      return NextResponse.json({
        items: cached.items,
        fetchedAt: cached.fetchedAt,
        stale: true,
      } satisfies NewsPayload)
    }
    return NextResponse.json({
      items: [],
      fetchedAt: new Date().toISOString(),
      stale: true,
    } satisfies NewsPayload)
  }

  try {
    const items = await fetchAllTopics(apiKey)
    if (items.length === 0) throw new Error('no items returned')
    const payload: CachedPayload = {
      items,
      fetchedAt: new Date().toISOString(),
      stale: false,
      bucketKey,
    }
    await writeLastGood(payload)
    return NextResponse.json({
      items: payload.items,
      fetchedAt: payload.fetchedAt,
      stale: false,
    } satisfies NewsPayload)
  } catch (err) {
    console.error('[the-nook] Perplexity fetch failed:', err)
    if (cached) {
      return NextResponse.json({
        items: cached.items,
        fetchedAt: cached.fetchedAt,
        stale: true,
      } satisfies NewsPayload)
    }
    return NextResponse.json({
      items: [],
      fetchedAt: new Date().toISOString(),
      stale: true,
    } satisfies NewsPayload)
  }
}
