/* eslint-disable @next/next/no-img-element */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownArticleProps = {
  className?: string
  markdown?: string | null
}

export function MarkdownArticle({ className, markdown }: MarkdownArticleProps) {
  if (!markdown) {
    return null
  }

  return (
    <div className={['markdown-body', className || ''].join(' ').trim()}>
      <ReactMarkdown
        components={{
          a: ({ children, href }) => (
            <a href={href} rel="noreferrer" target={href?.startsWith('http') ? '_blank' : undefined}>
              {children}
            </a>
          ),
          img: ({ alt, src }) => <img alt={alt || ''} className="markdown-image" src={src || ''} />,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
