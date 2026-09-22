import Image, { type ImageProps } from 'next/image'
import React from 'react'
import { proxyImageUrl } from '@/lib/api'

const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%2318181b"/><text x="150" y="150" text-anchor="middle" dy=".3em" fill="%23a855f7" font-size="120" font-family="system-ui">♪</text></svg>`

const fallbackArtwork = FALLBACK_SVG

type ArtworkProps = Omit<ImageProps, 'src' | 'width' | 'height' | 'loader' | 'unoptimized'> & {
  src?: string | null
  width?: number
  height?: number
}

export default function Artwork({ src, alt, width = 300, height = 300, ...props }: ArtworkProps) {
  const resolvedSrc = src || fallbackArtwork
  const proxiedSrc = proxyImageUrl(resolvedSrc)
  const [currentSrc, setCurrentSrc] = React.useState(proxiedSrc)
  const hasErroredRef = React.useRef(false)

  React.useEffect(() => {
    setCurrentSrc(proxyImageUrl(resolvedSrc))
    hasErroredRef.current = false
  }, [resolvedSrc])

  const handleError = React.useCallback(() => {
    if (!hasErroredRef.current) {
      hasErroredRef.current = true
      setCurrentSrc(proxyImageUrl(fallbackArtwork))
    }
  }, [])

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loader={({ src: imageSource }) => imageSource}
      unoptimized
      onError={handleError}
    />
  )
}
