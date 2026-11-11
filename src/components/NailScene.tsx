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
import { centerHit, viewRegistry, type ViewMode } from '../three/viewRegistry'
import type { FingerId, PlacedCharm } from '../types'

interface Props {
  finger: FingerId
  nail: NailBase
  mode: ViewMode
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

const SKIN_MATERIAL = new THREE.MeshStandardMaterial({ color: '#efc3ad', roughness: 0.75 })

export function NailScene({ finger, nail, mode }: Props) {
  const size = useDesign((s) => s.sizes[finger])
  const charms = useDesign((s) => s.designs[finger])
  const selectedId = useDesign((s) => s.selectedCharmId)
  const selectCharm = useDesign((s) => s.selectCharm)
  const updateCharm = useDesign((s) => s.updateCharm)

  const scale = useMemo(() => nailScale(nail, size), [nail, size])
  const W = nail.width * scale.x
  const L = nail.length * scale.z

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
    viewRegistry[mode] = castFromClient
    if (mode === 'top') {
      centerHit.fn = () => {
        const mesh = nailRef.current
        if (!mesh) return null
        // Straight down onto the nail, a little toward the cuticle from centre.
        raycaster.set(new THREE.Vector3(0, 100, L * 0.08), new THREE.Vector3(0, -1, 0))
        const hit = raycaster.intersectObject(mesh, false)[0]
        return hit ? hitToLocal(hit, raycaster.ray) : null
      }
    }
    return () => {
      if (viewRegistry[mode] === castFromClient) delete viewRegistry[mode]
      if (mode === 'top') centerHit.fn = null
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
      {mode === 'perspective' ? (
        <>
          <PerspectiveCamera makeDefault fov={35} position={[L * 1.3, L * 1.05, -L * 1.25]} near={0.5} far={1000} />
          <OrbitControls makeDefault target={[0, 0.5, 0]} minDistance={L * 0.6} maxDistance={L * 5} />
        </>
      ) : (
        <>
          <TopCamera W={W} L={L} />
          <OrbitControls makeDefault enableRotate={false} target={[0, 0, 0]} />
        </>
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

function TopCamera({ W, L }: { W: number; L: number }) {
  const size = useThree((s) => s.size)
  const ref = useRef<THREE.OrthographicCamera>(null)
  const zoom = Math.min(size.height / (L * 1.35), size.width / (W * 3.2))
  useEffect(() => {
    const cam = ref.current
    if (!cam) return
    cam.zoom = zoom
    cam.lookAt(0, 0, 0)
    cam.updateProjectionMatrix()
  }, [zoom])
  return (
    <OrthographicCamera
      ref={ref}
      makeDefault
      position={[0, 80, 0]}
      up={[0, 0, -1]}
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
