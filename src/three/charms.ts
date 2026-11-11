import * as THREE from 'three'
import type { CharmType } from '../types'

/**
 * Procedural charm library. Every geometry is in mm, sits on y = 0 and grows
 * toward +Y (the nail surface normal), centered on the origin in X/Z.
 * To add a charm: add its type to CharmType, then add an entry here.
 */
export interface CharmDef {
  type: CharmType
  label: string
  /** Display-only colour (STL has no colour). */
  color: string
  metalness: number
  roughness: number
  flatShading?: boolean
  build: () => THREE.BufferGeometry
}

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.25,
  bevelSize: 0.18,
  bevelSegments: 3,
  curveSegments: 16,
}

/** Extrude a 2D shape (drawn in the XY plane) so it lies flat on the nail. */
function flat(shape: THREE.Shape, opts: Partial<THREE.ExtrudeGeometryOptions> = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { ...EXTRUDE, ...opts })
  g.rotateX(-Math.PI / 2) // extrusion now points +Y, shape lies in XZ
  g.translate(0, 0.1, 0)
  return g
}

function polarShape(r: (t: number) => number, steps = 120) {
  const s = new THREE.Shape()
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const x = Math.cos(t) * r(t)
    const y = Math.sin(t) * r(t)
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  return s
}

function heart() {
  const s = new THREE.Shape()
  s.moveTo(0, -1.4)
  s.bezierCurveTo(-0.6, -0.8, -1.6, -0.3, -1.6, 0.45)
  s.bezierCurveTo(-1.6, 1.25, -0.6, 1.5, 0, 0.8)
  s.bezierCurveTo(0.6, 1.5, 1.6, 1.25, 1.6, 0.45)
  s.bezierCurveTo(1.6, -0.3, 0.6, -0.8, 0, -1.4)
  // Point the heart's tip toward the cuticle (+Z after the flat() rotation).
  const g = flat(s)
  g.rotateY(Math.PI)
  return g
}

function star() {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1.6 : 0.7
    const t = (i / 10) * Math.PI * 2 + Math.PI / 2
    if (i === 0) s.moveTo(Math.cos(t) * r, Math.sin(t) * r)
    else s.lineTo(Math.cos(t) * r, Math.sin(t) * r)
  }
  s.closePath()
  return flat(s, { bevelSize: 0.12 })
}

function bow() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(-0.6, 0.9, -1.9, 1.3, -1.9, 0.2)
  s.bezierCurveTo(-1.9, -0.9, -0.7, -0.6, 0, 0)
  s.bezierCurveTo(0.7, -0.6, 1.9, -0.9, 1.9, 0.2)
  s.bezierCurveTo(1.9, 1.3, 0.6, 0.9, 0, 0)
  const wings = flat(s)
  const knot = new THREE.SphereGeometry(0.45, 20, 14)
  knot.scale(1, 0.8, 1)
  knot.translate(0, 0.6, 0)
  return merge([wings, knot])
}

function crescent() {
  const s = new THREE.Shape()
  const R = 1.5
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const t = -Math.PI / 2 + (i / steps) * Math.PI
    const x = R * Math.cos(t)
    const y = R * Math.sin(t)
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  for (let i = steps; i >= 0; i--) {
    const t = -Math.PI / 2 + (i / steps) * Math.PI
    s.lineTo(R * 0.35 * Math.cos(t), R * Math.sin(t))
  }
  const g = flat(s, { bevelSize: 0.1 })
  g.translate(-0.4, 0, 0)
  return g
}

function flower() {
  const petals = flat(polarShape((t) => 0.75 + 0.85 * Math.abs(Math.cos(2.5 * t))), {
    bevelSize: 0.15,
  })
  const center = new THREE.SphereGeometry(0.5, 20, 14)
  center.scale(1, 0.7, 1)
  center.translate(0, 0.85, 0)
  return merge([petals, center])
}

function gem() {
  // Brilliant-ish cut: lathe with few segments + flat shading gives facets.
  const pts = [
    new THREE.Vector2(0, -0.2),
    new THREE.Vector2(1.35, 0.55),
    new THREE.Vector2(0.95, 1.15),
    new THREE.Vector2(0, 1.15),
  ]
  return new THREE.LatheGeometry(pts, 8)
}

function pearl() {
  const g = new THREE.SphereGeometry(1.1, 32, 20)
  g.translate(0, 0.9, 0)
  return g
}

function stud() {
  const g = new THREE.SphereGeometry(0.9, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  g.scale(1, 0.75, 1)
  const base = new THREE.CircleGeometry(0.9, 28)
  base.rotateX(Math.PI / 2)
  return merge([g, base])
}

/** Merge geometries after reducing them to a plain, non-indexed position+normal layout. */
export function merge(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = geoms.map((g) => {
    const n = g.index ? g.toNonIndexed() : g.clone()
    for (const key of Object.keys(n.attributes)) if (key !== 'position') n.deleteAttribute(key)
    n.clearGroups()
    return n
  })
  const total = parts.reduce((sum, p) => sum + p.attributes.position.count, 0)
  const pos = new Float32Array(total * 3)
  let off = 0
  for (const p of parts) {
    pos.set(p.attributes.position.array as Float32Array, off)
    off += p.attributes.position.count * 3
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.computeVertexNormals()
  return out
}

export const CHARMS: CharmDef[] = [
  { type: 'pearl', label: 'Pearl', color: '#f6efe6', metalness: 0.1, roughness: 0.25, build: pearl },
  { type: 'stud', label: 'Stud', color: '#d8b46a', metalness: 0.9, roughness: 0.25, build: stud },
  { type: 'gem', label: 'Gem', color: '#e9a6c2', metalness: 0.2, roughness: 0.05, flatShading: true, build: gem },
  { type: 'heart', label: 'Heart', color: '#e46a8f', metalness: 0.3, roughness: 0.3, build: heart },
  { type: 'star', label: 'Star', color: '#d8b46a', metalness: 0.9, roughness: 0.25, build: star },
  { type: 'bow', label: 'Bow', color: '#f2b8c9', metalness: 0.1, roughness: 0.4, build: bow },
  { type: 'crescent', label: 'Moon', color: '#c9ccd6', metalness: 0.9, roughness: 0.2, build: crescent },
  { type: 'flower', label: 'Flower', color: '#f7d6e0', metalness: 0.05, roughness: 0.5, build: flower },
]

export const charmDef = (type: CharmType) => CHARMS.find((c) => c.type === type)!

const geomCache = new Map<CharmType, THREE.BufferGeometry>()
export function charmGeometry(type: CharmType): THREE.BufferGeometry {
  let g = geomCache.get(type)
  if (!g) {
    g = charmDef(type).build()
    g.computeVertexNormals()
    geomCache.set(type, g)
  }
  return g
}
