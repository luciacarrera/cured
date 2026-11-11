import * as THREE from 'three'
import type { PlacedCharm, Vec3 } from '../types'

const UP = new THREE.Vector3(0, 1, 0)
/** How far (mm) charms sink into the nail so they fuse when printed. */
export const EMBED = 0.15

/** World-space transform of a charm on a nail scaled by `nailScale`. */
export function charmMatrix(charm: PlacedCharm, nailScale: THREE.Vector3): THREE.Matrix4 {
  const p = new THREE.Vector3(...charm.position).multiply(nailScale)
  // Normals transform with the inverse scale.
  const n = new THREE.Vector3(...charm.normal).divide(nailScale).normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(UP, n)
  const spin = new THREE.Quaternion().setFromAxisAngle(UP, THREE.MathUtils.degToRad(charm.spin))
  q.multiply(spin)
  p.addScaledVector(n, -EMBED)
  return new THREE.Matrix4().compose(p, q, new THREE.Vector3().setScalar(charm.scale))
}

export interface SurfaceHit {
  /** Base-nail local position and normal (what we store). */
  position: Vec3
  normal: Vec3
}

/** Convert a raycast hit on the (scaled) nail mesh into base-nail local coordinates. */
export function hitToLocal(hit: THREE.Intersection, ray: THREE.Ray): SurfaceHit | null {
  if (!hit.face) return null
  const obj = hit.object
  const local = obj.worldToLocal(hit.point.clone())
  const n = hit.face.normal.clone()
  // Make sure the normal faces the viewer regardless of the STL's winding.
  const worldN = n.clone().transformDirection(obj.matrixWorld)
  if (worldN.dot(ray.direction) > 0) n.negate()
  return { position: local.toArray() as Vec3, normal: n.normalize().toArray() as Vec3 }
}
