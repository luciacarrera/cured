import { HandsScreen } from './components/HandsScreen'
import { NailEditor } from './components/NailEditor'
import { useDesign } from './store/designStore'
import { useNail } from './three/loadNail'

export default function App() {
  const view = useDesign((s) => s.view)
  const activeFinger = useDesign((s) => s.activeFinger)
  const { nail, error } = useNail()

  return (
    <div className="h-dvh w-full overflow-hidden y2k-backdrop">
      {error && (
        <div className="absolute inset-x-0 top-0 z-20 bg-rose-100 px-4 py-2 text-center text-sm text-rose-700">
          {error}. Run <code>npm run convert-nail</code> or put your STL at public/models/nail.stl.
        </div>
      )}
      {view === 'editor' && activeFinger && nail ? (
        <NailEditor finger={activeFinger} nail={nail} />
      ) : (
        <HandsScreen nail={nail} />
      )}
    </div>
  )
}
