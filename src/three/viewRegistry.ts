import type { SurfaceHit } from './placement'

export type ViewMode = 'left' | 'top' | 'right' | 'bottom' | 'rotate'
/** The preset camera angles (everything except free rotation). */
export type FixedView = Exclude<ViewMode, 'rotate'>

/**
 * The editor canvas registers a function that raycasts from a screen point onto
 * its nail. HTML drag-and-drop (which happens outside React Three Fiber) uses
 * it to find where a charm was dropped.
 */
type Raycast = (clientX: number, clientY: number) => SurfaceHit | null
type CenterRaycast = () => SurfaceHit | null

export const screenHit: { fn: Raycast | null } = { fn: null }
/** Hit at the centre of the nail (used for tap-to-add). */
export const centerHit: { fn: CenterRaycast | null } = { fn: null }
