;(function () {
  const STORAGE_KEY = 'portfolio-cms-review-open'
  const ADMIN_ROOT = '/admin/#/collections'

  const collectionLinks = [
    { label: 'Home', detail: 'Homepage structure and featured selections', href: `${ADMIN_ROOT}/site_settings/entries/home` },
    { label: 'Site Shell', detail: 'Header, footer, intros, and about content', href: `${ADMIN_ROOT}/site_settings/entries/site` },
    { label: 'Projects', detail: 'Project records and detail pages', href: `${ADMIN_ROOT}/projects` },
    { label: 'Writing', detail: 'Articles and technical notes', href: `${ADMIN_ROOT}/writing` },
    { label: 'Archive', detail: 'Supporting records and diagrams', href: `${ADMIN_ROOT}/archive` },
    { label: 'Letters', detail: 'Recommendation letters and PDFs', href: `${ADMIN_ROOT}/recommendations` },
  ]

  const reviewSchemas = {
    'site_settings:home': {
      title: 'Home page review',
      note: 'This panel mirrors the public homepage structure. Click a line to jump to the matching CMS field.',
      groups: [
        { title: 'Hero', fields: ['Hero Eyebrow', 'Hero Title', 'Hero Body', 'Hero Image'] },
        { title: 'Primary links', fields: ['Hero Links'] },
        { title: 'Featured content', fields: ['Featured Projects Heading', 'Featured Projects', 'Featured Writing Heading', 'Featured Writing Entries', 'Featured Archive Heading', 'Featured Archive Entries'] },
        { title: 'Supporting modules', fields: ['Recommendations Note', 'Home Modules'] },
      ],
    },
    'site_settings:site': {
      title: 'Site shell review',
      note: 'Use this to move between the site chrome, page intros, and About page content.',
      groups: [
        { title: 'Header and footer', fields: ['Site Title', 'Site Tagline', 'Footer Line', 'Contact Email'] },
        { title: 'Navigation', fields: ['Navigation'] },
        { title: 'Page intros', fields: ['Page Intros'] },
        { title: 'About page', fields: ['About Section'] },
      ],
    },
    projects: {
      title: 'Project page review',
      note: 'This mirrors the structure of a project record. Click any line to jump to the field behind it.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Card Eyebrow', 'Date Label', 'Summary', 'Role'] },
        { title: 'Visuals', fields: ['Cover Image', 'Gallery'] },
        { title: 'Metadata', fields: ['Technologies', 'Attachments', 'External Links'] },
        { title: 'Narrative', fields: ['Body Markdown', 'Related Writing Slugs', 'Related Archive Slugs'] },
      ],
    },
    writing: {
      title: 'Writing review',
      note: 'This panel tracks the article record while you type. Use it as a quick outline and field navigator.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Card Eyebrow', 'Date Label', 'Summary'] },
        { title: 'Body', fields: ['Body Markdown'] },
        { title: 'Attachments and links', fields: ['Attachments', 'External Links'] },
        { title: 'Relations', fields: ['Related Project Slugs', 'Related Archive Slugs'] },
      ],
    },
    archive: {
      title: 'Archive record review',
      note: 'Archive entries work best as supporting records. Click through to update the exact field you need.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Card Eyebrow', 'Date Label', 'Summary'] },
        { title: 'Preview assets', fields: ['Cover Image', 'File', 'External URL'] },
        { title: 'Context', fields: ['Body Markdown', 'Related Project Slugs', 'Related Writing Slugs'] },
      ],
    },
    recommendations: {
      title: 'Letter review',
      note: 'Letters stay quiet on the public site, but everything here remains directly editable.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Card Eyebrow', 'Date Label', 'Summary'] },
        { title: 'Letter asset', fields: ['File', 'Cover Image', 'External URL'] },
        { title: 'Context', fields: ['Body Markdown', 'Role'] },
      ],
    },
  }

  let panel
  let scrollArea
  let titleNode
  let noteNode
  let metaNode
  let footerNode
  let initialized = false
  let renderQueued = false

  function normalize(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/\*+/g, '')
      .replace(/:+$/, '')
      .trim()
      .toLowerCase()
  }

  function truncate(text, max = 110) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim()
    if (!clean) return 'Empty'
    if (clean.length <= max) return clean
    return `${clean.slice(0, max - 1)}…`
  }

  function isEntryRoute(route) {
    return route && route.collection && route.entry
  }

  function parseRoute() {
    const hash = window.location.hash || ''
    const match = hash.match(/#\/collections\/([^/]+)(?:\/entries\/([^/?#]+))?/)
    if (!match) return {}
    return {
      collection: match[1],
      entry: match[2] || '',
      hash,
    }
  }

  function collectionLabel(route) {
    const labels = {
      site_settings: 'Site Structure',
      projects: 'Projects',
      writing: 'Writing',
      archive: 'Archive',
      recommendations: 'Letters',
    }

    return labels[route.collection] || 'Studio'
  }

  function schemaFor(route) {
    if (route.collection === 'site_settings' && route.entry) {
      return reviewSchemas[`site_settings:${route.entry}`]
    }

    return reviewSchemas[route.collection]
  }

  function getPanelOpen() {
    return window.localStorage.getItem(STORAGE_KEY) !== '0'
  }

  function setPanelOpen(open) {
    window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0')
    document.body.classList.toggle('cms-review-open', open)
    const toggle = document.querySelector('.cms-review-toggle')
    if (toggle) {
      toggle.textContent = open ? 'Hide Review' : 'Show Review'
    }
  }

  function ensureShell() {
    if (initialized) return

    const toggle = document.createElement('button')
    toggle.className = 'cms-review-toggle'
    toggle.type = 'button'
    toggle.addEventListener('click', () => setPanelOpen(!document.body.classList.contains('cms-review-open')))
    document.body.appendChild(toggle)

    panel = document.createElement('aside')
    panel.className = 'cms-review-panel'
    panel.innerHTML = `
      <div class="cms-review-inner">
        <div class="cms-review-header">
          <div class="cms-review-eyebrow">Review Panel</div>
          <h2></h2>
          <p></p>
          <div class="cms-review-meta"></div>
        </div>
        <div class="cms-review-scroll"></div>
        <div class="cms-review-footer">Click a review row to jump to that CMS field. Collection links switch the current studio route.</div>
      </div>
    `
    document.body.appendChild(panel)

    titleNode = panel.querySelector('h2')
    noteNode = panel.querySelector('p')
    metaNode = panel.querySelector('.cms-review-meta')
    scrollArea = panel.querySelector('.cms-review-scroll')
    footerNode = panel.querySelector('.cms-review-footer')

    setPanelOpen(getPanelOpen())
    initialized = true
  }

  function createNode(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (typeof text === 'string') node.textContent = text
    return node
  }

  function getFieldCandidates() {
    return Array.from(document.querySelectorAll('label, legend')).filter((node) => {
      const text = normalize(node.textContent)
      if (!text) return false
      if (text === 'search all') return false
      if (text.length > 120) return false
      if (node.closest('.cms-review-panel')) return false
      return true
    })
  }

  function findControlForLabel(label) {
    if (label instanceof HTMLLabelElement && label.htmlFor) {
      const direct = document.getElementById(label.htmlFor)
      if (direct) return direct
    }

    const container =
      label.closest('[class*="field"]') ||
      label.parentElement ||
      label.closest('fieldset') ||
      label.closest('div')

    if (!container) return null

    return container.querySelector(
      'input:not([type="hidden"]), textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'
    )
  }

  function readControlValue(control) {
    if (!control) return ''

    if (control.matches('textarea')) {
      return truncate(control.value || control.textContent || '')
    }

    if (control.matches('select')) {
      return truncate(control.options[control.selectedIndex]?.text || control.value || '')
    }

    if (control.matches('input[type="checkbox"]')) {
      return control.checked ? 'Enabled' : 'Disabled'
    }

    if (control.matches('input[type="file"]')) {
      return truncate(control.value || 'File picker')
    }

    if (control.matches('input')) {
      return truncate(control.value || '')
    }

    return truncate(control.textContent || '')
  }

  function findField(labelText) {
    const target = normalize(labelText)
    const labels = getFieldCandidates()

    for (const label of labels) {
      const text = normalize(label.textContent)
      if (text === target || text.includes(target) || target.includes(text)) {
        const control = findControlForLabel(label)
        return {
          label,
          control,
          value: readControlValue(control),
        }
      }
    }

    return null
  }

  function focusField(field) {
    if (!field) return

    const target = field.control || field.label
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.classList.add('cms-review-flash')
    window.setTimeout(() => target.classList.remove('cms-review-flash'), 1200)

    if (typeof target.focus === 'function') {
      window.setTimeout(() => target.focus({ preventScroll: true }), 160)
    }
  }

  function navigate(href) {
    if (!href) return
    window.location.href = href
  }

  function renderCollectionLinks() {
    const card = createNode('section', 'cms-review-card')
    card.appendChild(createNode('h3', '', 'Studio map'))

    const list = createNode('div', 'cms-review-link-list')
    collectionLinks.forEach((item) => {
      const button = createNode('button', 'cms-review-link')
      button.type = 'button'
      button.innerHTML = `<strong>${item.label}</strong><span>${item.detail}</span>`
      button.addEventListener('click', () => navigate(item.href))
      list.appendChild(button)
    })

    card.appendChild(list)
    scrollArea.appendChild(card)
  }

  function renderFieldGroups(schema) {
    schema.groups.forEach((group) => {
      const section = createNode('section', 'cms-review-group')
      section.appendChild(createNode('h3', '', group.title))

      const list = createNode('div', 'cms-review-field-list')
      group.fields.forEach((fieldName) => {
        const field = findField(fieldName)
        const button = createNode('button', `cms-review-field${field ? '' : ' is-missing'}`)
        button.type = 'button'
        button.innerHTML = `<strong>${fieldName}</strong><span>${field?.value || 'Field not visible on this screen yet'}</span>`
        button.addEventListener('click', () => {
          if (field) {
            focusField(field)
          }
        })
        list.appendChild(button)
      })

      section.appendChild(list)
      scrollArea.appendChild(section)
    })
  }

  function renderRouteMeta(route) {
    metaNode.innerHTML = ''

    const pills = [
      collectionLabel(route),
      route.entry ? `Entry: ${route.entry}` : 'Collection view',
      isEntryRoute(route) ? 'Live field sync' : 'Navigator mode',
    ]

    pills.forEach((text) => {
      metaNode.appendChild(createNode('span', 'cms-review-pill', text))
    })
  }

  function renderFallback(route) {
    const card = createNode('section', 'cms-review-card')
    card.appendChild(createNode('h3', '', 'No entry selected'))
    card.appendChild(
      createNode(
        'p',
        '',
        route.collection
          ? 'Choose an entry from the current collection to get a field-by-field review navigator.'
          : 'Open a collection or entry in the studio. The review panel will track the current route and update live as you type.'
      )
    )
    scrollArea.appendChild(card)
  }

  function render() {
    ensureShell()

    const route = parseRoute()
    const schema = schemaFor(route)

    titleNode.textContent = schema?.title || 'Portfolio Studio review'
    noteNode.textContent =
      schema?.note ||
      'Use this panel to move through the CMS structure faster. It follows the current route and can jump to the matching field when you are editing an entry.'
    renderRouteMeta(route)

    scrollArea.innerHTML = ''
    renderCollectionLinks()

    if (!schema || !isEntryRoute(route)) {
      renderFallback(route)
    } else {
      renderFieldGroups(schema)
    }

    footerNode.textContent = isEntryRoute(route)
      ? 'This panel updates from the current form state. It is meant as a live structure review, not a replacement for the editor itself.'
      : 'Click a collection shortcut to move through the studio. Once an entry is open, this panel becomes a live field navigator.'
  }

  function scheduleRender() {
    if (renderQueued) return
    renderQueued = true
    window.requestAnimationFrame(() => {
      renderQueued = false
      render()
    })
  }

  function boot() {
    render()

    const observer = new MutationObserver((mutations) => {
      const hasExternalMutation = mutations.some((mutation) => {
        const target = mutation.target
        if (!(target instanceof Element)) return true
        return !target.closest('.cms-review-panel') && !target.closest('.cms-review-toggle')
      })

      if (hasExternalMutation) {
        scheduleRender()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    document.body.addEventListener(
      'input',
      () => {
        scheduleRender()
      },
      true
    )

    document.body.addEventListener(
      'change',
      () => {
        scheduleRender()
      },
      true
    )

    window.addEventListener('hashchange', scheduleRender)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
