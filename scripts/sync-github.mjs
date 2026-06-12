import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const projectsDir = path.join(root, 'content', 'projects')
const outputFile = path.join(root, 'content', 'generated', 'github-cache.json')
const token = process.env.GITHUB_TOKEN || process.env.PORTFOLIO_GITHUB_TOKEN || ''

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function listProjectFiles() {
  const files = await fs.readdir(projectsDir)
  return files.filter((file) => file.endsWith('.json')).sort()
}

async function githubRequest(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'neerav-git-portfolio-sync',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function decodeBase64(content) {
  return Buffer.from(content, 'base64').toString('utf8')
}

async function loadExistingCache() {
  try {
    return await readJson(outputFile)
  } catch {
    return {}
  }
}

async function syncProject(project, existingCache) {
  const github = project.github || {}

  if (!github.syncEnabled || !github.owner || !github.repo) {
    return existingCache[project.slug] || null
  }

  const repoUrl = `https://api.github.com/repos/${github.owner}/${github.repo}`
  const repo = await githubRequest(repoUrl)

  let importedReadmeMarkdown = github.importedReadmeMarkdown || ''

  try {
    const readmePath = github.sourceReadmePath || 'README.md'
    const readme = await githubRequest(`${repoUrl}/contents/${readmePath}`)
    importedReadmeMarkdown = decodeBase64(readme.content)
  } catch (error) {
    console.warn(`README sync skipped for ${project.slug}: ${error.message}`)
  }

  return {
    importedReadmeMarkdown,
    lastSyncedAt: new Date().toISOString(),
    repoHomepage: repo.homepage || github.repoHomepage || '',
    repoLanguage: repo.language || github.repoLanguage || '',
    repoName: repo.name || github.repoName || github.repo,
    repoTopics: Array.isArray(repo.topics) ? repo.topics.map((value) => ({ value })) : github.repoTopics || [],
    repoUrl: repo.html_url || github.repoUrl || `https://github.com/${github.owner}/${github.repo}`,
    sourceDescription: repo.description || github.sourceDescription || project.summary || '',
    updatedAt: repo.updated_at || github.updatedAt || '',
  }
}

async function main() {
  const [files, existingCache] = await Promise.all([listProjectFiles(), loadExistingCache()])
  const output = { ...existingCache }

  for (const file of files) {
    const project = await readJson(path.join(projectsDir, file))

    try {
      const synced = await syncProject(project, existingCache)
      if (synced) {
        output[project.slug] = synced
      }
    } catch (error) {
      console.warn(`GitHub sync failed for ${project.slug}: ${error.message}`)
      if (existingCache[project.slug]) {
        output[project.slug] = existingCache[project.slug]
      }
    }
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Updated ${path.relative(root, outputFile)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
