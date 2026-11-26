import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(
  path.resolve(root, '../_refs/three-screen-lab-src/src/screens/wind/app.js'),
  'utf8',
)

let body = src
  .replace(/^\(\(\)\s*=>\s*\{\s*'use strict';\s*/, '')
  .replace(/\}\)\(\);\s*$/, '')

body = body
  .replace(
    /const \$ = \(s\) => document\.querySelector\(s\),\s*\$\$ = \(s\) => \[\.\.\.document\.querySelectorAll\(s\)\];/,
    `const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const screen = $('#wind-screen');
  const unstage = mountStage(screen, 1920, 1080);`,
  )
  .replace(/VizLabRuntime\.mountStage\(\$\('#wind-screen'\), 1920, 1080\);\s*/, '')
  .replace(/units = WindDemoData\.units;/, 'units = windDemoData.units;')
  .replace(/document\.body\.classList\.toggle\('stopped'/, "screen.classList.toggle('stopped'")
  .replace(
    /VizLabRuntime\.onDispose\(\(\) => \{\s*twin\?\.dispose\(\);\s*clearTimeout\(toastTimer\);\s*\}\);\s*/,
    '',
  )
  .replace(
    /twin = WindTwin\.create\(\$\('#turbine-host'\), showDetail\);/,
    "twin = createWindTwin($('#turbine-host'), showDetail);",
  )
  .replace(
    /document\.addEventListener\('keydown', \(e\) => \{/,
    'const onKeydown = (e) => {',
  )
  .replace(
    /\}\);\s*\$\$\('\[data-detail\]'\)/,
    `};
  window.addEventListener('keydown', onKeydown);
  $$('[data-detail]')`,
  )
  .replace(/setInterval\(tick, 1000\);/, 'const clockTimer = setInterval(tick, 1000);')

const out = `// @ts-nocheck
/* Ported from agentthink/three-screen-lab wind/app.js (MIT) */
import * as d3 from 'd3'
import { createWindTwin } from './scene'
import { windDemoData } from './data'
import { mountStage } from '../lab-shared/stage'

export function mountWind(root: HTMLElement) {
${body}
  return () => {
    twin?.dispose()
    clearTimeout(toastTimer)
    clearInterval(clockTimer)
    unstage()
    window.removeEventListener('keydown', onKeydown)
  }
}
`

const dest = path.join(root, 'src/pages/examples/09-scenes/02-wind/mount.ts')
fs.writeFileSync(dest, out)
console.log('wrote', dest, out.length)
