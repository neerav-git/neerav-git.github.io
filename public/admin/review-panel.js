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
        { title: 'Metadata', fields: ['Technologies', 'Attachments', 'Links'] },
        { title: 'Narrative', fields: ['Page Sections', 'GitHub'] },
      ],
    },
    writing: {
      title: 'Writing review',
      note: 'This panel tracks the article record while you type. Use it as a quick outline and field navigator.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Category', 'Publish Date', 'Excerpt'] },
        { title: 'Body', fields: ['Page Sections'] },
        { title: 'Attachments and links', fields: ['Attachments', 'Links'] },
      ],
    },
    archive: {
      title: 'Archive record review',
      note: 'Archive entries work best as supporting records. Click through to update the exact field you need.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Item Type', 'Date Label', 'Summary'] },
        { title: 'Preview assets', fields: ['Preview Image', 'Attachments', 'Links'] },
        { title: 'Context', fields: ['Page Sections'] },
      ],
    },
    recommendations: {
      title: 'Letter review',
      note: 'Letters stay quiet on the public site, but everything here remains directly editable.',
      groups: [
        { title: 'Identity', fields: ['Title', 'Slug', 'Recommender Name', 'Recommender Role', 'Excerpt'] },
        { title: 'Letter asset', fields: ['Thumbnail', 'PDF Letter', 'Links'] },
        { title: 'Context', fields: ['Context', 'Visibility Priority'] },
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
  let cmsConfigPromise = null
  const draftState = new Map()
  const SUPPORTED_DRAFT_COLLECTIONS = ['projects', 'writing', 'archive']

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

  function routeKey(route) {
    return `${route.collection || 'unknown'}:${route.entry || 'index'}`
  }

  function getDraftState(route) {
    const key = routeKey(route)

    if (!draftState.has(key)) {
      draftState.set(key, {
        brief: '',
        error: '',
        generating: false,
        output: null,
        status: '',
        sourceNotes: '',
      })
    }

    return draftState.get(key)
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

  function supportsDraftLab(route) {
    return isEntryRoute(route) && SUPPORTED_DRAFT_COLLECTIONS.includes(route.collection)
  }

  async function loadCmsConfig() {
    if (!cmsConfigPromise) {
      const candidates = ['/admin/config.yml', './config.yml', 'config.yml']

      cmsConfigPromise = (async () => {
        for (const path of candidates) {
          try {
            const response = await fetch(path)
            if (!response.ok) continue

            const text = await response.text()
            if (!text.trim()) continue

            const baseUrlMatch = text.match(/^\s*base_url:\s*(.+)\s*$/m)
            const authMatch = text.match(/^\s*auth_endpoint:\s*(.+)\s*$/m)

            return {
              authEndpoint: authMatch ? authMatch[1].trim() : '/api/auth',
              baseUrl: baseUrlMatch ? baseUrlMatch[1].trim() : '',
            }
          } catch {
            continue
          }
        }

        return { authEndpoint: '/api/auth', baseUrl: '' }
      })()
    }

    return cmsConfigPromise
  }

  function getProxyWriteUrl(config) {
    if (!config?.baseUrl) return ''
    return `${config.baseUrl.replace(/\/$/, '')}/api/write`
  }

  function getAuthTokenFromStorage() {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key) continue

      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.token === 'string' && parsed.token) return parsed.token
          if (typeof parsed.access_token === 'string' && parsed.access_token) return parsed.access_token
        }
      } catch {
        continue
      }
    }

    return ''
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

  function readControlRawValue(control) {
    if (!control) return ''

    if (control.matches('textarea')) {
      return String(control.value || control.textContent || '').trim()
    }

    if (control.matches('select')) {
      return String(control.value || '').trim()
    }

    if (control.matches('input[type="checkbox"]')) {
      return control.checked ? 'true' : 'false'
    }

    if (control.matches('input[type="file"]')) {
      return String(control.value || '').trim()
    }

    if (control.matches('input')) {
      return String(control.value || '').trim()
    }

    return String(control.textContent || '').trim()
  }

  function collectCurrentFields() {
    const fieldMap = {}

    getFieldCandidates().forEach((label) => {
      const text = String(label.textContent || '').replace(/\s+/g, ' ').trim()
      if (!text) return
      const control = findControlForLabel(label)
      const value = readControlRawValue(control)
      if (!value) return

      if (!fieldMap[text]) {
        fieldMap[text] = value
      }
    })

    return fieldMap
  }

  function collectVisibleAssets() {
    const values = new Set()

    Array.from(document.querySelectorAll('input, textarea')).forEach((node) => {
      const value = 'value' in node ? String(node.value || '').trim() : ''
      if (value.includes('/uploads/')) {
        values.add(value)
      }
    })

    Array.from(document.querySelectorAll('img')).forEach((img) => {
      const src = img.getAttribute('src') || ''
      if (src.includes('/uploads/')) {
        values.add(src)
      }
    })

    return Array.from(values)
  }

  function setControlValue(control, value) {
    if (!control) return false

    if ('value' in control) {
      control.value = value
      control.dispatchEvent(new Event('input', { bubbles: true }))
      control.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }

    return false
  }

  function applyDraftField(labelText, value) {
    const field = findField(labelText)
    if (!field?.control) return false
    return setControlValue(field.control, value)
  }

  function outputFieldMap(route) {
    const maps = {
      archive: { summary: 'Summary' },
      projects: { role: 'Role', summary: 'Summary' },
      writing: { excerpt: 'Excerpt' },
    }

    return maps[route.collection] || {}
  }

  function sourcePacketForRoute(route, state) {
    return {
      brief: state.brief,
      collection: route.collection,
      entry: route.entry,
      fields: collectCurrentFields(),
      route,
      sourceNotes: state.sourceNotes,
      visibleAssets: collectVisibleAssets(),
    }
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

  async function copyText(text) {
    if (!text) return false

    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  async function generateDraftForRoute(route) {
    const state = getDraftState(route)
    state.error = ''
    state.status = ''
    state.generating = true
    scheduleRender()

    try {
      const config = await loadCmsConfig()
      const proxyUrl = getProxyWriteUrl(config)
      const token = getAuthTokenFromStorage()

      if (!proxyUrl) {
        throw new Error('Could not resolve the writing proxy URL from admin/config.yml')
      }

      if (!token) {
        throw new Error('GitHub CMS login token not found. Sign in to the CMS first, then try again.')
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sourcePacketForRoute(route, state)),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || `Draft generation failed with ${response.status}`)
      }

      state.output = {
        draft: payload.draft || null,
        model: payload.model || 'unknown',
      }
      state.status = 'Draft generated in the panel. Review it, apply fields, and publish only when ready.'
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unexpected drafting error'
    } finally {
      state.generating = false
      scheduleRender()
    }
  }

  function renderDraftField(fieldLabel, value, onApply) {
    const card = createNode('article', 'cms-draft-field')
    card.appendChild(createNode('h4', '', fieldLabel))

    const label = createNode('label', '', 'Generated text')
    const textarea = createNode('textarea')
    textarea.value = value || ''
    label.appendChild(textarea)
    card.appendChild(label)

    const actions = createNode('div', 'cms-draft-field-actions')

    const copyButton = createNode('button', '', 'Copy')
    copyButton.type = 'button'
    copyButton.addEventListener('click', async () => {
      onApply((await copyText(textarea.value)) ? 'Copied to clipboard.' : 'Clipboard copy was blocked by the browser.')
    })
    actions.appendChild(copyButton)

    const applyButton = createNode('button', '', 'Apply to field')
    applyButton.type = 'button'
    applyButton.addEventListener('click', () => {
      onApply(textarea.value, true)
    })
    actions.appendChild(applyButton)

    card.appendChild(actions)
    return card
  }

  function renderDraftSection(section, index, state) {
    const card = createNode('article', 'cms-draft-section')
    const heading = section?.title ? `${index + 1}. ${section.title}` : `Section ${index + 1}`
    card.appendChild(createNode('h4', '', heading))

    if (section?.blockType) {
      card.appendChild(createNode('small', '', `Suggested block: ${section.blockType}`))
    }

    if (section?.eyebrow) {
      card.appendChild(createNode('small', '', `Eyebrow: ${section.eyebrow}`))
    }

    if (section?.description) {
      const descriptionLabel = createNode('label', '', 'Standfirst')
      const descriptionArea = createNode('textarea')
      descriptionArea.value = section.description
      descriptionLabel.appendChild(descriptionArea)
      card.appendChild(descriptionLabel)
    }

    const label = createNode('label', '', 'Section markdown')
    const textarea = createNode('textarea')
    textarea.value = section?.markdown || ''
    label.appendChild(textarea)
    card.appendChild(label)

    const actions = createNode('div', 'cms-draft-field-actions')

    const copyMarkdown = createNode('button', '', 'Copy markdown')
    copyMarkdown.type = 'button'
    copyMarkdown.addEventListener('click', async () => {
      state.status = (await copyText(textarea.value)) ? 'Section markdown copied to clipboard.' : 'Clipboard copy was blocked by the browser.'
      scheduleRender()
    })
    actions.appendChild(copyMarkdown)

    const copyJson = createNode('button', '', 'Copy section JSON')
    copyJson.type = 'button'
    copyJson.addEventListener('click', async () => {
      const payload = JSON.stringify(
        {
          blockType: section?.blockType || 'proseSection',
          eyebrow: section?.eyebrow || '',
          title: section?.title || '',
          description: section?.description || '',
          markdown: section?.markdown || '',
          context: section?.context || '',
        },
        null,
        2
      )
      state.status = (await copyText(payload)) ? 'Section JSON copied to clipboard.' : 'Clipboard copy was blocked by the browser.'
      scheduleRender()
    })
    actions.appendChild(copyJson)

    card.appendChild(actions)

    if (section?.imageSuggestion) {
      card.appendChild(createNode('small', '', `Image role: ${section.imageSuggestion}`))
    }

    if (section?.context) {
      card.appendChild(createNode('small', '', `Context line: ${section.context}`))
    }

    return card
  }

  function renderDraftLab(route) {
    const state = getDraftState(route)
    const card = createNode('section', 'cms-review-card cms-draft-card')
    card.appendChild(createNode('h3', '', 'Draft Lab'))
    card.appendChild(
      createNode(
        'p',
        'cms-draft-help',
        'Uses GPT-5.5 through the CMS proxy to draft grounded long-form copy from the entry currently open in Decap. It reads the visible form state, keeps images and files replaceable through the CMS, and does not publish automatically.'
      )
    )

    const form = createNode('div', 'cms-draft-form')

    const briefLabel = createNode('label', '', 'Editorial brief')
    const briefInput = createNode('textarea')
    briefInput.placeholder = 'What should this entry emphasize, avoid, or clarify?'
    briefInput.value = state.brief
    briefInput.addEventListener('input', () => {
      state.brief = briefInput.value
    })
    briefLabel.appendChild(briefInput)
    form.appendChild(briefLabel)

    const notesLabel = createNode('label', '', 'Source notes')
    const notesInput = createNode('textarea')
    notesInput.placeholder = 'Optional notes, source constraints, or context not yet reflected in the form.'
    notesInput.value = state.sourceNotes
    notesInput.addEventListener('input', () => {
      state.sourceNotes = notesInput.value
    })
    notesLabel.appendChild(notesInput)
    form.appendChild(notesLabel)

    const actions = createNode('div', 'cms-draft-actions')

    const generateButton = createNode(
      'button',
      'cms-draft-button is-primary',
      state.generating ? 'Generating…' : 'Generate deep rewrite'
    )
    generateButton.type = 'button'
    generateButton.disabled = state.generating
    generateButton.addEventListener('click', () => {
      generateDraftForRoute(route)
    })
    actions.appendChild(generateButton)

    const clearButton = createNode('button', 'cms-draft-button', 'Clear')
    clearButton.type = 'button'
    clearButton.disabled = state.generating
    clearButton.addEventListener('click', () => {
      state.brief = ''
      state.error = ''
      state.output = null
      state.sourceNotes = ''
      state.status = ''
      scheduleRender()
    })
    actions.appendChild(clearButton)

    const focusSectionsButton = createNode('button', 'cms-draft-button', 'Focus page sections')
    focusSectionsButton.type = 'button'
    focusSectionsButton.addEventListener('click', () => {
      focusField(findField('Page Sections'))
    })
    actions.appendChild(focusSectionsButton)

    form.appendChild(actions)
    card.appendChild(form)

    if (state.error) {
      card.appendChild(createNode('p', 'cms-draft-status cms-draft-error', state.error))
    } else if (state.status) {
      card.appendChild(createNode('p', 'cms-draft-status', state.status))
    }

    if (!state.output?.draft) {
      scrollArea.appendChild(card)
      return
    }

    const output = state.output.draft
    const outputWrap = createNode('div', 'cms-draft-output')

    if (output?.overview) {
      outputWrap.appendChild(createNode('p', 'cms-draft-help', `${output.overview} Model: ${state.output.model}.`))
    }

    Object.entries(outputFieldMap(route)).forEach(([outputKey, fieldLabel]) => {
      const value = output?.fields?.[outputKey]
      if (!value) return

      outputWrap.appendChild(
        renderDraftField(fieldLabel, value, (nextValue, shouldApply = false) => {
          if (!shouldApply) {
            state.status = nextValue
            scheduleRender()
            return
          }

          const applied = applyDraftField(fieldLabel, nextValue)
          state.status = applied
            ? `${fieldLabel} updated in the current CMS form. Save or publish in Decap when ready.`
            : `${fieldLabel} could not be located in the current form.`
          scheduleRender()
        })
      )
    })

    if (Array.isArray(output?.sections) && output.sections.length) {
      const sectionWrap = createNode('div', 'cms-draft-sections')
      sectionWrap.appendChild(createNode('h4', '', 'Draft sections'))

      output.sections.forEach((section, index) => {
        sectionWrap.appendChild(renderDraftSection(section, index, state))
      })

      const copyAllButton = createNode('button', 'cms-draft-button', 'Copy sections JSON')
      copyAllButton.type = 'button'
      copyAllButton.addEventListener('click', async () => {
        state.status = (await copyText(JSON.stringify(output.sections, null, 2)))
          ? 'Draft sections JSON copied to clipboard.'
          : 'Clipboard copy was blocked by the browser.'
        scheduleRender()
      })
      sectionWrap.appendChild(copyAllButton)
      outputWrap.appendChild(sectionWrap)
    }

    if (Array.isArray(output?.imagePlan) && output.imagePlan.length) {
      const imageWrap = createNode('div', 'cms-draft-image-plan')
      imageWrap.appendChild(createNode('h4', '', 'Image plan'))

      output.imagePlan.forEach((item) => {
        imageWrap.appendChild(createNode('article', 'cms-draft-image-item', item))
      })

      outputWrap.appendChild(imageWrap)
    }

    card.appendChild(outputWrap)
    scrollArea.appendChild(card)
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
      if (supportsDraftLab(route)) {
        renderDraftLab(route)
      }
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
