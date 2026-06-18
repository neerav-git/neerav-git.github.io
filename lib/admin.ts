const adminRoot = '/admin/#'

function adminEntry(collection: string, entry: string) {
  return `${adminRoot}/collections/${collection}/entries/${entry}`
}

export const adminLinks = {
  archive: (slug: string) => adminEntry('archive', slug),
  article: (slug: string) => adminEntry('writing', slug),
  home: adminEntry('site_settings', 'home'),
  lettersPage: adminEntry('site_settings', 'site'),
  project: (slug: string) => adminEntry('projects', slug),
  projectsPage: adminEntry('site_settings', 'site'),
  recommendations: (slug: string) => adminEntry('recommendations', slug),
  resumePage: adminEntry('site_settings', 'site'),
  site: adminEntry('site_settings', 'site'),
  writingPage: adminEntry('site_settings', 'site'),
}

export function getPageEditTarget(pathname: string) {
  if (pathname === '/') {
    return { href: adminLinks.home, label: 'Edit home page' }
  }

  if (pathname === '/projects' || pathname === '/projects/') {
    return { href: adminLinks.projectsPage, label: 'Edit projects page' }
  }

  if (pathname.startsWith('/projects/')) {
    const slug = pathname.replace(/^\/projects\//, '').replace(/\/$/, '')
    return { href: adminLinks.project(slug), label: 'Edit this project' }
  }

  if (pathname === '/writing' || pathname === '/writing/') {
    return { href: adminLinks.writingPage, label: 'Edit writing page' }
  }

  if (pathname.startsWith('/writing/')) {
    const slug = pathname.replace(/^\/writing\//, '').replace(/\/$/, '')
    return { href: adminLinks.article(slug), label: 'Edit this article' }
  }

  if (pathname === '/archive' || pathname === '/archive/') {
    return { href: adminLinks.site, label: 'Edit archive page' }
  }

  if (pathname.startsWith('/archive/')) {
    const slug = pathname.replace(/^\/archive\//, '').replace(/\/$/, '')
    return { href: adminLinks.archive(slug), label: 'Edit this archive item' }
  }

  if (pathname === '/about' || pathname === '/about/') {
    return { href: adminLinks.site, label: 'Edit about page' }
  }

  if (pathname === '/recommendations' || pathname === '/recommendations/') {
    return { href: adminLinks.lettersPage, label: 'Edit letters page' }
  }

  if (pathname === '/resume' || pathname === '/resume/') {
    return { href: adminLinks.resumePage, label: 'Edit resume page' }
  }

  return { href: '/admin/', label: 'Open studio' }
}
