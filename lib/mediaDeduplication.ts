import { getUploadUrl } from '@/lib/assets'
import type { Asset, ContentBlock } from '@/lib/types'

export function normalizeContentMedia(blocks: ContentBlock[] | null | undefined, initialUrls: string[] = []) {
  const usedUrls = new Set(initialUrls.filter(Boolean))
  const normalizedBlocks = (blocks || []).flatMap((block) => {
    const mediaUrl = getUploadUrl(block.media)
    if (!mediaUrl) return [block]
    if (usedUrls.has(mediaUrl)) {
      if (block.blockType === 'figure' || block.blockType === 'mediaFeature') return []
      return [{ ...block, media: null }]
    }
    usedUrls.add(mediaUrl)
    return [block]
  })

  return { blocks: normalizedBlocks, usedUrls }
}

export function uniqueAssets(assets: Asset[] | null | undefined, usedUrls: Set<string>) {
  return (assets || []).filter((asset) => {
    const url = getUploadUrl(asset)
    if (!url || usedUrls.has(url)) return false
    usedUrls.add(url)
    return true
  })
}
