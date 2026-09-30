import { Router, Request, Response } from 'express'

const router = Router()

const REQUEST_TIMEOUT_MS = 15_000

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

    let response: globalThis.Response | undefined
    let lastStatus = 502

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const upstreamResponse = await fetch(parsedUrl, {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; AuraicStudio/1.0)',
        },
        redirect: 'follow',
        signal: controller.signal,
      })

      if (upstreamResponse.ok) {
        response = upstreamResponse
      } else {
        lastStatus = upstreamResponse.status
      }
    } catch {
      lastStatus = 502
    } finally {
      clearTimeout(timeout)
    }

    if (!response) {
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
