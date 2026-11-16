import { useEffect, useState } from 'react'
import { HAND_ART } from '../data/handArt'

/** Keep the loading screen up at least this long so it never just flashes. */
const MIN_DISPLAY_MS = 1200
/** Never hold anyone on the loading screen longer than this. */
const MAX_WAIT_MS = 8000

function loadImage(url: string): Promise<void> {
  const img = new Image()
  img.src = url
  return img.decode().catch(() => {
    // A broken image shouldn't block the app; the home view handles it.
  })
}

/**
 * True once the app is ready to show: the nail model has settled (loaded or
 * failed), the hands illustration and web fonts are in, and the minimum
 * display time has passed — or the safety timeout has fired.
 */
export function useAppReady(nailSettled: boolean): boolean {
  const [assetsReady, setAssetsReady] = useState(false)
  const [minElapsed, setMinElapsed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([loadImage(HAND_ART.url), document.fonts.ready.catch(() => undefined)]).then(
      () => alive && setAssetsReady(true),
    )
    const min = window.setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS)
    const max = window.setTimeout(() => setTimedOut(true), MAX_WAIT_MS)
    return () => {
      alive = false
      window.clearTimeout(min)
      window.clearTimeout(max)
    }
  }, [])

  return timedOut || (nailSettled && assetsReady && minElapsed)
}
