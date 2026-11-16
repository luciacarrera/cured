import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharmType, FingerId, PlacedCharm, Vec3, View } from '../types'
import { DEFAULT_SIZE, FINGERS } from '../data/fingers'

interface DesignState {
  view: View
  activeFinger: FingerId | null
  selectedCharmId: string | null
  designs: Record<FingerId, PlacedCharm[]>
  sizes: Record<FingerId, number>
  /** Fingers the user has marked as finished with "Save nail". */
  saved: Record<FingerId, boolean>

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
  Object.fromEntries(FINGERS.map((f) => [f.id, []])) as unknown as Record<FingerId, PlacedCharm[]>
const defaultSizes = () =>
  Object.fromEntries(FINGERS.map((f) => [f.id, DEFAULT_SIZE[f.name]])) as Record<FingerId, number>

const emptySaved = () =>
  Object.fromEntries(FINGERS.map((f) => [f.id, false])) as Record<FingerId, boolean>

const newId = () => Math.random().toString(36).slice(2, 10)

export const useDesign = create<DesignState>()(
  persist(
    (set) => ({
      view: 'hands',
      activeFinger: null,
      selectedCharmId: null,
      designs: emptyDesigns(),
      sizes: defaultSizes(),
      saved: emptySaved(),

      openFinger: (id) => set({ view: 'editor', activeFinger: id, selectedCharmId: null }),
      backToHands: () => set({ view: 'hands', selectedCharmId: null }),
      setSize: (finger, size) => set((s) => ({ sizes: { ...s.sizes, [finger]: size } })),
      saveFinger: (finger) =>
        set((s) => ({
          saved: { ...s.saved, [finger]: true },
          view: 'hands',
          selectedCharmId: null,
        })),
      addCharm: (finger, type, position, normal) => {
        const charm: PlacedCharm = { id: newId(), type, position, normal, spin: 0, scale: 1 }
        set((s) => ({
          designs: { ...s.designs, [finger]: [...s.designs[finger], charm] },
          selectedCharmId: charm.id,
        }))
      },
      updateCharm: (finger, id, patch) =>
        set((s) => ({
          designs: {
            ...s.designs,
            [finger]: s.designs[finger].map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),
      removeCharm: (finger, id) =>
        set((s) => ({
          designs: { ...s.designs, [finger]: s.designs[finger].filter((c) => c.id !== id) },
          selectedCharmId: s.selectedCharmId === id ? null : s.selectedCharmId,
        })),
      selectCharm: (id) => set({ selectedCharmId: id }),
      clearFinger: (finger) =>
        set((s) => ({
          designs: { ...s.designs, [finger]: [] },
          saved: { ...s.saved, [finger]: false },
          selectedCharmId: null,
        })),
      clearAll: () => set({ designs: emptyDesigns(), saved: emptySaved(), selectedCharmId: null }),
    }),
    {
      name: 'cured-design',
      version: 1,
      partialize: (s) => ({ designs: s.designs, sizes: s.sizes, saved: s.saved }),
      // Older saves predate `saved`; fill in any missing fingers.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DesignState>
        return { ...current, ...p, saved: { ...current.saved, ...p.saved } }
      },
    },
  ),
)
