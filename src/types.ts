export type Hand = 'left' | 'right'
export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
export type FingerId = `${'L' | 'R'}-${FingerName}`

export type Vec3 = [number, number, number]

export type CharmType =
  | 'pearl' | 'stud' | 'gem' | 'heart' | 'star' | 'bow' | 'crescent' | 'flower'

/**
 * A charm placed on a nail. Position and normal are stored in the base nail's
 * local space (the unscaled STL, in mm), so changing a finger's nail size keeps
 * charms on the surface.
 */
export interface PlacedCharm {
  id: string
  type: CharmType
  position: Vec3
  normal: Vec3
  /** Rotation around the surface normal, in degrees. */
  spin: number
  /** Uniform scale multiplier. */
  scale: number
}

export type View = 'sets' | 'hands' | 'editor'

/** One full set of ten press-ons, saved in the library. */
export interface NailSet {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  designs: Record<FingerId, PlacedCharm[]>
  sizes: Record<FingerId, number>
  saved: Record<FingerId, boolean>
}
