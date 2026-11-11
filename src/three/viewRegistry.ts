import type { SurfaceHit } from './placement'

export type ViewMode = 'perspective' | 'top'

/**
 * Each editor canvas registers a function that raycasts from a screen point onto
 * its nail. HTML drag-and-drop (which happens outside React Three Fiber) uses
 * these to find where a charm was dropped.
 */
type Raycast = (clientX: number, clientY: number) => SurfaceHit | null
type CenterRaycast = () => SurfaceHit | null

export const viewRegistry: Partial<Record<ViewMode, Raycast>> = {}
/** Hit at the centre of the nail (used for tap-to-add). */
export const centerHit: { fn: CenterRaycast | null } = { fn: null }
