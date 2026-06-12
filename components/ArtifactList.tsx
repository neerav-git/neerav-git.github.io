import { getUploadLabel, getUploadUrl } from '@/lib/assets'
import type { AttachmentItem, LinkItem } from '@/lib/types'

type ArtifactListProps = {
  attachments?: AttachmentItem[] | null
  links?: LinkItem[] | null
  title?: string
}

export function ArtifactList({ attachments, links, title = 'Resources' }: ArtifactListProps) {
  const hasAttachments = Boolean(attachments?.length)
  const hasLinks = Boolean(links?.length)

  if (!hasAttachments && !hasLinks) {
    return null
  }

  return (
    <section className="resource-panel">
      <div className="panel-eyebrow">{title}</div>
      <div className="resource-list">
        {attachments?.map((attachment, index) => {
          const href =
            (typeof attachment.externalUrl === 'string' ? attachment.externalUrl : null) ||
            getUploadUrl(attachment.file)
          const label =
            (typeof attachment.label === 'string' ? attachment.label : '') ||
            getUploadLabel(attachment.file) ||
            `Attachment ${index + 1}`

          if (!href) {
            return null
          }

          return (
            <a className="resource-item" href={href} key={`${label}-${index}`} rel="noreferrer" target="_blank">
              <span>{label}</span>
              {typeof attachment.description === 'string' && attachment.description ? (
                <small>{attachment.description}</small>
              ) : null}
            </a>
          )
        })}

        {links?.map((link, index) => {
          if (typeof link.url !== 'string' || !link.url) {
            return null
          }

          return (
            <a className="resource-item" href={link.url} key={`${link.url}-${index}`} rel="noreferrer" target="_blank">
              <span>{typeof link.label === 'string' ? link.label : 'Link'}</span>
              {typeof link.description === 'string' && link.description ? <small>{link.description}</small> : null}
            </a>
          )
        })}
      </div>
    </section>
  )
}
