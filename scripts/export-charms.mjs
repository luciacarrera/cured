// Exports every charm in src/three/charms.ts as its own binary STL (mm, Z-up),
// so each one can be printed, inspected or imported into Rhino on its own.
// Usage: node scripts/export-charms.mjs [outDir]   (default: public/models/charms)
// Vite's SSR loader is used so the TypeScript charm library loads unchanged.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'
import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'

const outDir = process.argv[2] ?? 'public/models/charms'
fs.mkdirSync(outDir, { recursive: true })

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] }, // don't scan index.html / the app
})

try {
  const { CHARMS } = await server.ssrLoadModule('/src/three/charms.ts')
  const exporter = new STLExporter()

  for (const def of CHARMS) {
    const geometry = def.build()
    geometry.rotateX(Math.PI / 2) // three.js Y-up -> slicer/Rhino Z-up (same as the plate export)
    const data = exporter.parse(new THREE.Mesh(geometry), { binary: true })
    const file = path.join(outDir, `${def.type}.stl`)
    fs.writeFileSync(file, Buffer.from(data.buffer, data.byteOffset, data.byteLength))

    geometry.computeBoundingBox()
    const size = new THREE.Vector3()
    geometry.boundingBox.getSize(size)
    console.log(
      `${file}  ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} mm`,
    )
  }
} finally {
  await server.close()
}
