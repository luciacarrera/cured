import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { FINGERS, NAIL_SIZES } from '../data/fingers'
import type { FingerId, PlacedCharm } from '../types'
import { charmGeometry, merge } from './charms'
import { loadNail, nailScale } from './loadNail'
import { charmMatrix } from './placement'

const GAP = 6 // mm between nails on the plate

/** Build one geometry containing all 10 nails (with charms) laid out in a 5×2 grid, Y-up. */
export async function buildPlate(
  designs: Record<FingerId, PlacedCharm[]>,
  sizes: Record<FingerId, number>,
): Promise<THREE.BufferGeometry> {
  const nail = await loadNail()
  const cellW = Math.max(...NAIL_SIZES.map((s) => s.width)) + GAP
  const cellL = Math.max(...NAIL_SIZES.map((s) => s.length)) + GAP

  const parts: THREE.BufferGeometry[] = []
  FINGERS.forEach((finger, i) => {
    const col = i % 5
    const row = Math.floor(i / 5)
    const scale = nailScale(nail, sizes[finger.id])
    const offset = new THREE.Matrix4().makeTranslation(
      (col - 2) * cellW,
      0,
      (row - 0.5) * cellL,
    )

    const nailGeom = nail.geometry.clone()
    nailGeom.applyMatrix4(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z))
    nailGeom.applyMatrix4(offset)
    parts.push(nailGeom)

    for (const charm of designs[finger.id] ?? []) {
      const g = charmGeometry(charm.type).clone()
      g.applyMatrix4(charmMatrix(charm, scale))
      g.applyMatrix4(offset)
      parts.push(g)
    }
  })
  return merge(parts)
}

/** Export the plate as a binary STL (Z-up, mm) and trigger a download. */
export async function exportStl(
  designs: Record<FingerId, PlacedCharm[]>,
  sizes: Record<FingerId, number>,
  filename = 'cured-nails.stl',
) {
  const geometry = await buildPlate(designs, sizes)
  geometry.rotateX(Math.PI / 2) // three.js Y-up -> slicer Z-up
  const mesh = new THREE.Mesh(geometry)
  const data = new STLExporter().parse(mesh, { binary: true }) as DataView
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'model/stl' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
