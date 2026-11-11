import { useEffect, useMemo, useRef } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei"
import * as THREE from 'three'
import { useDesign } from '../store/designStore'
import { charmDef, charmGeometry } from '../three/charms'
import { nailScale, type NailBase } from '../three/loadNail'
import { charmMatrix, hitToLocal, type SurfaceHit } from '../three/placement'
import { centerHit, screenHit, type FixedView, type ViewMode } from '../three/viewRegistry'
import type { FingerId, PlacedCharm } from '../types'

interface Props {
  finger: FingerId
  nail: NailBase
  mode: ViewMode
  /** Preset angle that free rotation starts from. */
  rotateFrom: FixedView
}

const NAIL_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: '#fbe1da',
  roughness: 0.18,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  sheen: 0.4,
  sheenColor: new THREE.Color('#ffd9e2'),
  side: THREE.DoubleSide,
})

const SKIN_MATERIAL = new THREE.MeshStandardMaterial({ color: '#89cff0', roughness: 0.75 })

export function NailScene({ finger, nail, mode, rotateFrom }: Props) {
  const size = useDesign((s) => s.sizes[finger])
  const charms = useDesign((s) => s.designs[finger])
  const selectedId = useDesign((s) => s.selectedCharmId)
  const selectCharm = useDesign((s) => s.selectCharm)
  const updateCharm = useDesign((s) => s.updateCharm)

  const scale = useMemo(() => nailScale(nail, size), [nail, size])
  const W = nail.width * scale.x
  const L = nail.length * scale.z
  const H = nail.height * scale.y

  const nailRef = useRef<THREE.Mesh>(null)
  const { camera, gl, controls } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // --- raycasting helpers -------------------------------------------------
  const castFromNdc = (ndc: THREE.Vector2): SurfaceHit | null => {
    const mesh = nailRef.current
    if (!mesh) return null
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.intersectObject(mesh, false)[0]
    return hit ? hitToLocal(hit, raycaster.ray) : null
  }
  const castFromClient = (x: number, y: number) => {
    const r = gl.domElement.getBoundingClientRect()
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null
    return castFromNdc(
      new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1),
    )
  }

  useEffect(() => {
    screenHit.fn = castFromClient
    centerHit.fn = () => {
      const mesh = nailRef.current
      if (!mesh) return null
      // Straight down onto the nail, a little toward the cuticle from centre.
      raycaster.set(new THREE.Vector3(0, 100, L * 0.08), new THREE.Vector3(0, -1, 0))
      const hit = raycaster.intersectObject(mesh, false)[0]
      return hit ? hitToLocal(hit, raycaster.ray) : null
    }
    return () => {
      if (screenHit.fn === castFromClient) screenHit.fn = null
      centerHit.fn = null
    }
  })

  // --- dragging an existing charm along the surface ------------------------
  const startDrag = (e: ThreeEvent<PointerEvent>, charm: PlacedCharm) => {
    e.stopPropagation()
    selectCharm(charm.id)
    const ctrl = controls as unknown as { enabled: boolean } | null
    if (ctrl) ctrl.enabled = false
    const move = (ev: PointerEvent) => {
      const hit = castFromClient(ev.clientX, ev.clientY)
      if (hit) updateCharm(finger, charm.id, hit)
    }
    const up = () => {
      if (ctrl) ctrl.enabled = true
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // --- finger under the nail ----------------------------------------------
  const finger3d = useMemo(() => {
    const r = W * 0.36 // match the narrow cuticle end of the tip, not the free edge
    const len = 70
    const g = new THREE.CapsuleGeometry(r, len, 12, 32)
    g.rotateX(Math.PI / 2)
    g.scale(1, 0.72, 1)
    const tipZ = L / 2 - L * 0.42 // the finger tip sits under the nail, the rest extends past
    g.translate(0, -0.72 * r + 0.35, tipZ + r + len / 2)
    return g
  }, [W, L])
  useEffect(() => () => finger3d.dispose(), [finger3d])

  return (
    <>
      {mode === 'rotate' ? (
        <group key={`rotate-${rotateFrom}`}>
          <PerspectiveCamera makeDefault fov={35} position={rotateStart(rotateFrom, L, H)} near={0.5} far={1000} />
          <OrbitControls makeDefault target={[0, H / 2, 0]} minDistance={L * 0.6} maxDistance={L * 5} />
        </group>
      ) : (
        // Keyed so each view button resets the camera and any zoom/pan.
        <group key={mode}>
          <OrthoViewCamera view={mode} W={W} L={L} H={H} />
          <OrbitControls makeDefault enableRotate={false} target={[0, mode === 'top' || mode === 'bottom' ? 0 : H / 2, 0]} />
        </group>
      )}

      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 40, -10]} intensity={1.6} />
      <directionalLight position={[-25, 20, 30]} intensity={0.6} color="#dff1ff" />
      {/* Studio reflections built locally (no HDR download needed). */}
      <Environment resolution={64} environmentIntensity={0.7}>
        <Lightformer form="rect" intensity={3} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#bfe3ff" position={[-10, 2, 0]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[10, 2, -5]} rotation-y={-Math.PI / 2} scale={[20, 6, 1]} />
      </Environment>

      <mesh geometry={finger3d} material={SKIN_MATERIAL} raycast={() => null} />

      <mesh
        ref={nailRef}
        geometry={nail.geometry}
        material={NAIL_MATERIAL}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation()
          selectCharm(null)
        }}
      />

      {charms.map((c) => (
        <CharmMesh
          key={c.id}
          charm={c}
          nailScale={scale}
          selected={c.id === selectedId}
          onPointerDown={(e) => startDrag(e, c)}
        />
      ))}
    </>
  )
}

type Vec = [number, number, number]
/** How far the side cameras are raised above the nail, so its top surface shows. */
const SIDE_ELEVATION = THREE.MathUtils.degToRad(35)
/** How far the side cameras swing round toward the free edge, so the finger recedes diagonally. */
const SIDE_AZIMUTH = THREE.MathUtils.degToRad(40)
const sideDir = (side: 1 | -1): Vec => [
  side * Math.cos(SIDE_ELEVATION) * Math.cos(SIDE_AZIMUTH),
  Math.sin(SIDE_ELEVATION),
  -Math.cos(SIDE_ELEVATION) * Math.sin(SIDE_AZIMUTH),
]

const ORTHO_VIEWS: Record<FixedView, { dir: Vec; up: Vec }> = {
  // Looking down, free edge toward the top of the screen.
  top: { dir: [0, 1, 0], up: [0, 0, -1] },
  // Three-quarter views from each side, above and toward the free edge. On the right the
  // finger comes in from the upper left; the left view mirrors it (upper right).
  left: { dir: sideDir(-1), up: [0, 1, 0] },
  right: { dir: sideDir(1), up: [0, 1, 0] },
  // Looking up from underneath (a true view, so mirrored relative to top).
  bottom: { dir: [0, -1, 0], up: [0, 0, -1] },
}

/**
 * Where the free-rotation camera starts: along the same direction as the preset that was
 * showing, at a distance that frames the nail. Straight up/down are nudged slightly so the
 * orbit has a defined heading and the free edge stays toward the top of the screen.
 */
function rotateStart(from: FixedView, L: number, H: number): Vec {
  const nudge = from === 'top' ? 0.02 : from === 'bottom' ? -0.02 : 0
  const [x, y, z] = ORTHO_VIEWS[from].dir
  const d = new THREE.Vector3(x, y, z + nudge).normalize().multiplyScalar(L * 2.1)
  return [d.x, d.y + H / 2, d.z]
}

/** Ortho zoom that fits a W×H×L box, seen along `dir`, into a width×height screen area. */
function fitZoom(dir: Vec, up: Vec, [W, H, L]: Vec, width: number, height: number) {
  const back = new THREE.Vector3(...dir).normalize()
  const right = new THREE.Vector3(...up).cross(back).normalize()
  const screenUp = back.clone().cross(right)
  const extent = (axis: THREE.Vector3) =>
    Math.abs(axis.x) * W + Math.abs(axis.y) * H + Math.abs(axis.z) * L
  return Math.min(width / extent(right), height / extent(screenUp))
}

function OrthoViewCamera({
  view,
  W,
  L,
  H,
}: {
  view: FixedView
  W: number
  L: number
  H: number
}) {
  const size = useThree((s) => s.size)
  const ref = useRef<THREE.OrthographicCamera>(null)
  const { dir, up } = ORTHO_VIEWS[view]
  const D = 80
  // Fit the nail with some breathing room; side views leave space above for charms.
  const zoom =
    view === 'top' || view === 'bottom'
      ? Math.min(size.height / (L * 1.35), size.width / (W * 3.2))
      : fitZoom(dir, up, [W, H, L], size.width / 1.6, size.height / 1.6)
  const target: Vec = [0, view === 'top' || view === 'bottom' ? 0 : H / 2, 0]
  useEffect(() => {
    const cam = ref.current
    if (!cam) return
    cam.zoom = zoom
    cam.lookAt(...target)
    cam.updateProjectionMatrix()
  }, [zoom, view, H])
  return (
    <OrthographicCamera
      ref={ref}
      makeDefault
      position={[dir[0] * D + target[0], dir[1] * D + target[1], dir[2] * D + target[2]]}
      up={up}
      zoom={zoom}
      near={0.1}
      far={500}
    />
  )
}

interface CharmMeshProps {
  charm: PlacedCharm
  nailScale: THREE.Vector3
  selected: boolean
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
}

function CharmMesh({ charm, nailScale, selected, onPointerDown }: CharmMeshProps) {
  const def = charmDef(charm.type)
  const matrix = useMemo(() => charmMatrix(charm, nailScale), [charm, nailScale])
  return (
    <mesh
      geometry={charmGeometry(charm.type)}
      matrix={matrix}
      matrixAutoUpdate={false}
      onPointerDown={onPointerDown}
      onPointerOver={() => (document.body.style.cursor = 'grab')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <meshPhysicalMaterial
        color={def.color}
        metalness={def.metalness}
        roughness={def.roughness}
        flatShading={def.flatShading}
        clearcoat={0.6}
        emissive={selected ? '#5fb8ec' : '#000000'}
        emissiveIntensity={selected ? 0.35 : 0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
