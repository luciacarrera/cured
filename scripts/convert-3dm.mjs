// Converts the nail solid in a Rhino .3dm file into a binary STL for the app.
// Usage: node scripts/convert-3dm.mjs <input.3dm> <output.stl>
// - picks the object with the most render-mesh faces (the nail, not curves / picture frames)
// - converts model units to millimetres
// - converts Rhino's Z-up to the app's Y-up (Rhino +Y, the free edge, becomes -Z)
import fs from 'node:fs'
import rhino3dm from 'rhino3dm'

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error('Usage: node scripts/convert-3dm.mjs <input.3dm> <output.stl>')
  process.exit(1)
}

const rh = await rhino3dm()
const doc = rh.File3dm.fromByteArray(new Uint8Array(fs.readFileSync(input)))

const unitToMm = {
  Millimeters: 1, Centimeters: 10, Meters: 1000, Inches: 25.4, Feet: 304.8,
}
const unitName = Object.keys(rh.UnitSystem).find(
  (k) => rh.UnitSystem[k] === doc.settings().modelUnitSystem,
)
const scale = unitToMm[unitName] ?? 1
console.log(`Model units: ${unitName} (x${scale} to mm)`)

function meshesOf(geom) {
  const t = geom.objectType
  if (t === rh.ObjectType.Mesh) return [geom]
  if (t === rh.ObjectType.Extrusion) return [geom.getMesh(rh.MeshType.Any)].filter(Boolean)
  if (t === rh.ObjectType.Brep) {
    const out = []
    for (let i = 0; i < geom.faces().count; i++) {
      const m = geom.faces().get(i).getMesh(rh.MeshType.Any)
      if (m) out.push(m)
    }
    return out
  }
  return []
}

let best = null
const objects = doc.objects()
for (let i = 0; i < objects.count; i++) {
  const meshes = meshesOf(objects.get(i).geometry())
  const faces = meshes.reduce((n, m) => n + m.faces().count, 0)
  if (!best || faces > best.faces) best = { meshes, faces, index: i }
}
if (!best || best.faces === 0) {
  console.error('No meshable object found. In Rhino, make sure the nail is shaded/rendered once before saving, or export STL directly.')
  process.exit(1)
}

const tris = []
for (const m of best.meshes) {
  m.faces().convertQuadsToTriangles()
  const v = m.vertices()
  const f = m.faces()
  for (let i = 0; i < f.count; i++) {
    const [a, b, c] = f.get(i)
    // (x, y, z) Rhino -> (x, z, -y) app, in mm
    tris.push([a, b, c].map((k) => {
      const [x, y, z] = v.get(k)
      return [x * scale, z * scale, -y * scale]
    }))
  }
}

const buf = Buffer.alloc(84 + 50 * tris.length)
buf.write('cured nail', 0)
buf.writeUInt32LE(tris.length, 80)
tris.forEach((t, i) => {
  let o = 84 + 50 * i + 12 // normal left as 0 -> recomputed by consumers
  for (const p of t) for (const c of p) { buf.writeFloatLE(c, o); o += 4 }
})
fs.writeFileSync(output, buf)
console.log(`Wrote ${tris.length} triangles from object #${best.index} to ${output}`)
