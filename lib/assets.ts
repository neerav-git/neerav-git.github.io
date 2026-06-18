export function getUploadUrl(asset: unknown) {
  if (typeof asset === 'string') {
    return asset
  }

  if (!asset || typeof asset !== 'object') {
    return null
  }

  const record = asset as Record<string, unknown>
  return typeof record.url === 'string' ? record.url : null
}

export function getUploadAlt(asset: unknown) {
  if (typeof asset === 'string') {
    return formatAssetLabel(asset)
  }

  if (!asset || typeof asset !== 'object') {
    return ''
  }

  const record = asset as Record<string, unknown>
  if (typeof record.alt === 'string' && record.alt) {
    return record.alt
  }

  if (typeof record.label === 'string' && record.label) {
    return record.label
  }

  if (typeof record.filename === 'string' && record.filename) {
    return formatAssetLabel(record.filename)
  }

  if (typeof record.url === 'string' && record.url) {
    return formatAssetLabel(record.url)
  }

  return ''
}

export function getUploadLabel(asset: unknown) {
  if (typeof asset === 'string') {
    return asset.split('/').pop() || ''
  }

  if (!asset || typeof asset !== 'object') {
    return ''
  }

  const record = asset as Record<string, unknown>

  if (typeof record.label === 'string' && record.label) {
    return record.label
  }

  if (typeof record.filename === 'string') {
    return record.filename
  }

  return ''
}

function formatAssetLabel(value: string) {
  const filename = value.split('/').pop()?.split('?')[0] || value
  const withoutExtension = filename.replace(/\.[a-z0-9]+$/i, '')
  return withoutExtension.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}
