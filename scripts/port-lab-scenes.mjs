import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.resolve(root, '../_refs/three-screen-lab-src/src')
const OUT = path.join(root, 'src/pages/examples/09-scenes')

const write = (rel, content) => {
  const file = path.join(OUT, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
  console.log('wrote', rel, fs.statSync(file).size)
}

const unwrapIife = (raw) =>
  raw
    .replace(/^\/\*[\s\S]*?\*\//, '')
    .replace(/^\s*\(\(\)\s*=>\s*\{/, '')
    .replace(/^\s*'use strict';\s*/, '')
    .replace(/\}\)\(\);\s*$/, '')

// —— astra ——
{
  let code = unwrapIife(fs.readFileSync(path.join(SRC, 'shared/astra-geometry.js'), 'utf8'))
  code = code.replace(/const THREE = window\.THREE;\s*/, '').replace(/window\.AstraGeometry = \{[\s\S]*$/m, '')
  write(
    'lab-shared/astraGeometry.ts',
    `// @ts-nocheck
/* Ported from agentthink/three-screen-lab (MIT) */
import * as THREE from 'three'

${code}

export const AstraGeometry = {
  THREE,
  box,
  cylinder,
  line,
  standard,
  glow,
  label,
  seed,
  halo,
  batchStatic,
}
`,
  )
}

// —— observatory scene ——
{
  let code = unwrapIife(fs.readFileSync(path.join(SRC, 'shared/observatory-scene.js'), 'utf8'))
  code = code
    .replace(/const T = window\.THREE;/, 'const T = THREE;')
    .replace(
      /window\.ObservatoryScenes = \{ builders, create \};/,
      `export function registerSceneBuilder(kind, builder) {
  builders[kind] = builder
}
export { create as createObservatoryScene }
export { builders }
`,
    )
  write(
    'lab-shared/observatoryScene.ts',
    `// @ts-nocheck
/* Ported from agentthink/three-screen-lab (MIT) */
import * as THREE from 'three'

${code}
`,
  )
}

// —— wind ——
{
  let code = unwrapIife(fs.readFileSync(path.join(SRC, 'screens/wind/model.js'), 'utf8'))
  code = code
    .replace(/const T = window\.THREE,\s*TAU = Math\.PI \* 2;/, 'const T = THREE;\n  const TAU = Math.PI * 2;')
    .replace(/window\.WindTwin = \{\s*create\(host, onPart\) \{/, 'export function createWindTwin(host, onPart) {')
    .replace(/\n\s*\},\s*\};\s*$/, '\n}\n')
  write(
    '02-wind/scene.ts',
    `// @ts-nocheck
/* Ported from agentthink/three-screen-lab (MIT) */
import * as THREE from 'three'

${code}
`,
  )
}

// —— factory ——
{
  let code = unwrapIife(fs.readFileSync(path.join(SRC, 'screens/factory/model.js'), 'utf8'))
  code = code
    .replace(/const T = window\.THREE;\s*if \(!T\) return;/, 'const T = THREE;')
    .replace(
      /window\.FactoryDigitalTwin = \{ create \};/,
      'export function createFactoryScene(host, options = {}) {\n    return create(host, options);\n  }',
    )
  write(
    '03-factory/scene.ts',
    `// @ts-nocheck
/* Ported from agentthink/three-screen-lab (MIT) */
import * as THREE from 'three'

${code}
`,
  )
}

// —— observatory models ——
for (const [dir, outRel, kind] of [
  ['agriculture', '06-agriculture', 'agriculture'],
  ['industry', '07-industry', 'industry'],
  ['park', '08-park', 'park'],
]) {
  let code = unwrapIife(fs.readFileSync(path.join(SRC, 'screens', dir, 'model.js'), 'utf8'))
  code = code
    .replace(
      /const \{ THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic \} =\s*window\.AstraGeometry;/,
      'const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } = AstraGeometry;',
    )
    .replace(
      new RegExp(`ObservatoryScenes\\.builders\\.${kind}\\s*=`),
      `registerSceneBuilder('${kind}',`,
    )
  code = code.trimEnd()
  if (code.endsWith('};')) code = code.slice(0, -2) + ')'
  else if (code.endsWith('}')) code = code + ')'
  write(
    `${outRel}/scene.ts`,
    `// @ts-nocheck
/* Ported from agentthink/three-screen-lab (MIT) */
import { AstraGeometry } from '../lab-shared/astraGeometry'
import { registerSceneBuilder } from '../lab-shared/observatoryScene'

${code}
`,
  )
}

console.log('ok')
