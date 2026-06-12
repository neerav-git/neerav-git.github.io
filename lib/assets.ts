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
    return ''
  }

  if (!asset || typeof asset !== 'object') {
    return ''
  }

  const record = asset as Record<string, unknown>
  return typeof record.alt === 'string' ? record.alt : ''
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
