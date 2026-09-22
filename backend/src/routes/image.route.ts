import { Router, Request, Response } from 'express'

const router = Router()

const REQUEST_TIMEOUT_MS = 15_000
const AUDIO_PLACEHOLDER = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#18181b"/><text x="300" y="325" text-anchor="middle" fill="#a855f7" font-size="180" font-family="system-ui">♪</text></svg>',
)

function getAudiusFallbackUrls(imageUrl: URL) {
  const match = imageUrl.hostname.match(/^cn(\d+)\.mainnet\.audiusindex\.org$/i)
  const isAudiusGateway = [
    'audius.zeogrid.com',
    'audius.rickymombo.com',
  ].includes(imageUrl.hostname.toLowerCase())
  if (!match && !isAudiusGateway) return []

  return [1, 2, 3, 4]
    .filter((node) => !match || String(node) !== match[1])
    .map((node) => {
      const fallbackUrl = new URL(imageUrl.toString())
      fallbackUrl.hostname = `cn${node}.mainnet.audiusindex.org`
      return fallbackUrl
    })
}

router.get('/proxy', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string | undefined
  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    const parsedUrl = new URL(imageUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Unsupported image URL protocol' })
    }

    const candidateUrls = [parsedUrl, ...getAudiusFallbackUrls(parsedUrl)]
    let response: globalThis.Response | undefined
    let lastStatus = 502

    for (const candidateUrl of candidateUrls) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const candidateResponse = await fetch(candidateUrl, {
          headers: {
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (compatible; AuraicStudio/1.0)',
          },
          redirect: 'follow',
          signal: controller.signal,
        })

        if (candidateResponse.ok) {
          response = candidateResponse
          break
        }

        lastStatus = candidateResponse.status
      } catch {
        lastStatus = 502
      } finally {
        clearTimeout(timeout)
      }
    }

    if (!response) {
      const isAudiusContentHost =
        parsedUrl.hostname.endsWith('.mainnet.audiusindex.org') ||
        ['audius.zeogrid.com', 'audius.rickymombo.com'].includes(parsedUrl.hostname.toLowerCase())

      if (isAudiusContentHost) {
        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'public, max-age=300')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(200).send(AUDIO_PLACEHOLDER)
      }

      return res.status(lastStatus >= 400 ? lastStatus : 502).json({ error: 'Failed to fetch image' })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
  } catch (error) {
    res.status(400).json({ error: 'Invalid image URL' })
  }
})

export default router
