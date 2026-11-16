import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharmType, FingerId, NailSet, PlacedCharm, Vec3, View } from '../types'
import { DEFAULT_SIZE, FINGERS } from '../data/fingers'

type Designs = Record<FingerId, PlacedCharm[]>
type Sizes = Record<FingerId, number>
type Saved = Record<FingerId, boolean>

interface DesignState {
  view: View
  /** The set open in the hands view / editor. */
  activeSetId: string | null
  activeFinger: FingerId | null
  selectedCharmId: string | null
  sets: Record<string, NailSet>

  /**
   * Working copy of the active set. Every edit writes here and into
   * `sets[activeSetId]`, so components can keep reading `s.designs[finger]`.
   */
  designs: Designs
  sizes: Sizes
  /** Fingers the user has marked as finished with "Save nail". */
  saved: Saved

  createSet: (name: string, sizesFrom?: string | null) => void
  openSet: (id: string) => void
  backToSets: () => void
  renameSet: (id: string, name: string) => void
  duplicateSet: (id: string) => void
  deleteSet: (id: string) => void

  openFinger: (id: FingerId) => void
  backToHands: () => void
  setSize: (finger: FingerId, size: number) => void
  saveFinger: (finger: FingerId) => void
  addCharm: (finger: FingerId, type: CharmType, position: Vec3, normal: Vec3) => void
  updateCharm: (finger: FingerId, id: string, patch: Partial<PlacedCharm>) => void
  removeCharm: (finger: FingerId, id: string) => void
  selectCharm: (id: string | null) => void
  clearFinger: (finger: FingerId) => void
  clearAll: () => void
}

const emptyDesigns = () =>
  Object.fromEntries(FINGERS.map((f) => [f.id, []])) as unknown as Designs
const defaultSizes = () =>
  Object.fromEntries(FINGERS.map((f) => [f.id, DEFAULT_SIZE[f.name]])) as Sizes
const emptySaved = () => Object.fromEntries(FINGERS.map((f) => [f.id, false])) as Saved

const newId = () => Math.random().toString(36).slice(2, 10)

export const newSet = (name: string, sizes: Sizes = defaultSizes()): NailSet => {
  const now = Date.now()
  return {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    designs: emptyDesigns(),
    sizes: { ...sizes },
    saved: emptySaved(),
  }
}

/** Sets, most recently edited first. */
export const sortedSets = (sets: Record<string, NailSet>) =>
  Object.values(sets).sort((a, b) => b.updatedAt - a.updatedAt)

/** "Set 3" — the first "Set N" name not already taken. */
export function nextSetName(sets: Record<string, NailSet>) {
  const taken = new Set(Object.values(sets).map((s) => s.name.trim().toLowerCase()))
  let n = Object.keys(sets).length + 1
  while (taken.has(`set ${n}`)) n++
  return `Set ${n}`
}

/** Apply an edit to the working copy and mirror it into the active set. */
function edit(
  s: DesignState,
  patch: Partial<Pick<DesignState, 'designs' | 'sizes' | 'saved'>>,
  extra: Partial<DesignState> = {},
): Partial<DesignState> {
  const id = s.activeSetId
  if (!id || !s.sets[id]) return { ...patch, ...extra }
  return {
    ...patch,
    ...extra,
    sets: { ...s.sets, [id]: { ...s.sets[id], ...patch, updatedAt: Date.now() } },
  }
}

const load = (set: NailSet) => ({
  activeSetId: set.id,
  designs: set.designs,
  sizes: set.sizes,
  saved: set.saved,
  view: 'hands' as View,
  activeFinger: null,
  selectedCharmId: null,
})

export const useDesign = create<DesignState>()(
  persist(
    (set) => ({
      view: 'sets',
      activeSetId: null,
      activeFinger: null,
      selectedCharmId: null,
      sets: {},
      designs: emptyDesigns(),
      sizes: defaultSizes(),
      saved: emptySaved(),

      createSet: (name, sizesFrom) =>
        set((s) => {
          const from = sizesFrom ? s.sets[sizesFrom] : undefined
          const created = newSet(name.trim() || nextSetName(s.sets), from?.sizes)
          return { sets: { ...s.sets, [created.id]: created }, ...load(created) }
        }),
      openSet: (id) =>
        set((s) => (s.sets[id] ? load(s.sets[id]) : {})),
      backToSets: () =>
        set({ view: 'sets', activeSetId: null, activeFinger: null, selectedCharmId: null }),
      renameSet: (id, name) =>
        set((s) =>
          s.sets[id] && name.trim()
            ? { sets: { ...s.sets, [id]: { ...s.sets[id], name: name.trim() } } }
            : {},
        ),
      duplicateSet: (id) =>
        set((s) => {
          const src = s.sets[id]
          if (!src) return {}
          const copy: NailSet = {
            ...structuredClone(src),
            id: newId(),
            name: `${src.name} copy`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          return { sets: { ...s.sets, [copy.id]: copy } }
        }),
      deleteSet: (id) =>
        set((s) => {
          const { [id]: _gone, ...rest } = s.sets
          return s.activeSetId === id
            ? { sets: rest, view: 'sets', activeSetId: null, activeFinger: null }
            : { sets: rest }
        }),

      openFinger: (id) => set({ view: 'editor', activeFinger: id, selectedCharmId: null }),
      backToHands: () => set({ view: 'hands', selectedCharmId: null }),
      setSize: (finger, size) => set((s) => edit(s, { sizes: { ...s.sizes, [finger]: size } })),
      saveFinger: (finger) =>
        set((s) =>
          edit(s, { saved: { ...s.saved, [finger]: true } }, { view: 'hands', selectedCharmId: null }),
        ),
      addCharm: (finger, type, position, normal) => {
        const charm: PlacedCharm = { id: newId(), type, position, normal, spin: 0, scale: 1 }
        set((s) =>
          edit(
            s,
            { designs: { ...s.designs, [finger]: [...s.designs[finger], charm] } },
            { selectedCharmId: charm.id },
          ),
        )
      },
      updateCharm: (finger, id, patch) =>
        set((s) =>
          edit(s, {
            designs: {
              ...s.designs,
              [finger]: s.designs[finger].map((c) => (c.id === id ? { ...c, ...patch } : c)),
            },
          }),
        ),
      removeCharm: (finger, id) =>
        set((s) =>
          edit(
            s,
            { designs: { ...s.designs, [finger]: s.designs[finger].filter((c) => c.id !== id) } },
            { selectedCharmId: s.selectedCharmId === id ? null : s.selectedCharmId },
          ),
        ),
      selectCharm: (id) => set({ selectedCharmId: id }),
      clearFinger: (finger) =>
        set((s) =>
          edit(
            s,
            { designs: { ...s.designs, [finger]: [] }, saved: { ...s.saved, [finger]: false } },
            { selectedCharmId: null },
          ),
        ),
      clearAll: () =>
        set((s) => edit(s, { designs: emptyDesigns(), saved: emptySaved() }, { selectedCharmId: null })),
    }),
    {
      name: 'cured-design',
      version: 2,
      partialize: (s) => ({ sets: s.sets }),
      // v1 stored a single design at the top level. Keep it as the first set.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        if (version < 2) {
          const designs = { ...emptyDesigns(), ...(p.designs as Designs | undefined) }
          const hasWork = Object.values(designs).some((d) => d.length > 0)
          if (!hasWork) return { sets: {} }
          const first = newSet('My first set', { ...defaultSizes(), ...(p.sizes as Sizes | undefined) })
          first.designs = designs
          first.saved = { ...emptySaved(), ...(p.saved as Saved | undefined) }
          return { sets: { [first.id]: first } }
        }
        return p as { sets: Record<string, NailSet> }
      },
    },
  ),
)
