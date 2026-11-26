import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.resolve(root, '../_refs/three-screen-lab-src/src')
const OUT = path.join(root, 'src/pages/examples/09-scenes')

const map = [
  ['screens/wind/template.html', '02-wind/markup.html'],
  ['screens/factory/template.html', '03-factory/markup.html'],
  ['screens/population/template.html', '04-population/markup.html'],
  ['screens/inspection/template.html', '05-inspection/markup.html'],
  ['screens/agriculture/template.html', '06-agriculture/markup.html'],
  ['screens/industry/template.html', '07-industry/markup.html'],
  ['screens/park/template.html', '08-park/markup.html'],
]

for (const [from, to] of map) {
  const html = fs.readFileSync(path.join(SRC, from), 'utf8')
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || ''
  const markup = body.replace(/<script[\s\S]*?<\/script>/gi, '').trim()
  fs.writeFileSync(path.join(OUT, to), markup)
  console.log(to, markup.length)
}
