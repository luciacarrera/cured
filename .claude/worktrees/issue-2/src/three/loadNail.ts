import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useEffect, useState } from 'react'
import { NAIL_SIZES } from '../data/fingers'

export const NAIL_URL = '/models/nail.stl'

export interface NailBase {
  geometry: THREE.BufferGeometry
  /** Base nail width (x), length (z) and height (y) in mm. */
  width: number
  length: number
  height: number
}

let cache: Promise<NailBase> | null = null

/**
 * Loads the base nail STL once. Expected orientation (what scripts/convert-3dm.mjs
 * writes): Y up, free edge toward -Z, cuticle toward +Z, units in mm.
 * The geometry is centered in X/Z and rests on y = 0.
 */
export function loadNail(): Promise<NailBase> {
  cache ??= fetch(NAIL_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load ${NAIL_URL} (${r.status})`)
      return r.arrayBuffer()
    })
    .then((buf) => {
      let g = new STLLoader().parse(buf)
      g.deleteAttribute('normal')
      g = mergeVertices(g, 1e-4)
      g.computeBoundingBox()
      const bb = g.boundingBox!
      const c = new THREE.Vector3()
      bb.getCenter(c)
      g.translate(-c.x, -bb.min.y, -c.z)
      g.computeVertexNormals()
      g.computeBoundingBox()
      const size = new THREE.Vector3()
      g.boundingBox!.getSize(size)
      return { geometry: g, width: size.x, length: size.z, height: size.y }
    })
  return cache
}

export function useNail(): { nail: NailBase | null; error: string | null } {
  const [nail, setNail] = useState<NailBase | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    loadNail()
      .then((n) => alive && setNail(n))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])
  return { nail, error }
}

/** Non-uniform scale that turns the base nail into the given gel-x size. */
export function nailScale(nail: NailBase, size: number): THREE.Vector3 {
  const s = NAIL_SIZES[size] ?? NAIL_SIZES[NAIL_SIZES.length - 1]
  const sx = s.width / nail.width
  const sz = s.length / nail.length
  return new THREE.Vector3(sx, sx, sz)
}
