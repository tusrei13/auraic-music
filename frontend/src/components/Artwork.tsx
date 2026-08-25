import Image, { type ImageProps } from 'next/image'

const fallbackArtwork = '/favicon.ico'

type ArtworkProps = Omit<ImageProps, 'src' | 'width' | 'height' | 'loader' | 'unoptimized'> & {
  src?: string | null
  width?: number
  height?: number
}

export default function Artwork({ src, alt, width = 300, height = 300, ...props }: ArtworkProps) {
  return (
    <Image
      {...props}
      src={src || fallbackArtwork}
      alt={alt}
      width={width}
      height={height}
      loader={({ src: imageSource }) => imageSource}
      unoptimized
    />
  )
}
