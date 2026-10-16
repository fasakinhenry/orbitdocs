import { useEffect } from 'react'

const SITE = 'https://orbitdoc.vercel.app'

export default function Seo({ title, description, path = '/' }: { title: string; description: string; path?: string }) {
  useEffect(() => {
    document.title = title
    const set = (selector: string, content: string, attribute = 'name') => {
      let tag = document.head.querySelector<HTMLMetaElement>(selector)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attribute, selector.includes('property=') ? selector.split('"')[1] : selector.split('"')[1])
        document.head.appendChild(tag)
      }
      tag.content = content
    }
    set('meta[name="description"]', description)
    set('meta[property="og:title"]', title)
    set('meta[property="og:description"]', description)
    set('meta[name="twitter:title"]', title)
    set('meta[name="twitter:description"]', description)
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${SITE}${path}`
  }, [description, path, title])
  return null
}
