import { IMAGE_PROXY } from './constants'

export function thumbUrl(src: string, width = 320) {
  return `${IMAGE_PROXY}?url=${encodeURIComponent(src)}&w=${width}&output=webp&q=75`
}
