import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageRoot = path.join(root, 'node_modules', 'kokoro-js')
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
const expectedVersion = '1.2.1'
const expectedSha256 = '6067712fe4c43cdb36c762f860a5ab8d96ea1d9c8882466438eb9f3d0d20be8f'

if (packageJson.version !== expectedVersion) {
  throw new Error(`Expected kokoro-js ${expectedVersion}; found ${packageJson.version}. Review the runtime before updating the pinned version.`)
}

const source = path.join(packageRoot, 'dist', 'kokoro.web.js')
const bytes = fs.readFileSync(source)
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
if (sha256 !== expectedSha256) {
  throw new Error(`kokoro-js ${expectedVersion} runtime hash changed: ${sha256}`)
}

const output = path.join(root, 'public', 'guide', 'vendor', `kokoro.web-${expectedVersion}.js`)
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, bytes)
console.log(`[guide voice] pinned kokoro-js ${expectedVersion} runtime -> ${path.relative(root, output)}`)
