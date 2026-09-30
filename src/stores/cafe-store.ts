import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type CafeFormData,
  type CafeInput,
  cafeToForm,
  emptyCafeForm,
  type SavedCafe,
} from "@/utils/interfaces";
import {
  type CollectionLoadState,
  fetchCollection,
  loadStateFromServer,
  nextLoadStateForFetch,
} from "@/stores/collection-load";

export type DrawerMode = "view" | "edit";

export type CafeState = {
  cafes: SavedCafe[];
  submissions: SavedCafe[];
  cafesLoadState: CollectionLoadState;
  submissionsLoadState: CollectionLoadState;
  editing: CafeFormData | null;
  editingVersion: number;
  drawerMode: DrawerMode | null;
  hasHydrated: boolean;
  saveError: string | null;
};

export type CafeActions = {
  fetchCafes: () => Promise<void>;
  fetchSubmissions: () => Promise<void>;
  saveCafe: (cafe: CafeInput & { publicId?: string }) => Promise<SavedCafe | null>;
  setFavorite: (publicId: string, favorite: boolean) => Promise<void>;
  removeCafe: (publicId: string) => Promise<void>;
  openEditor: (cafe: CafeFormData) => void;
  openModify: (cafe: CafeFormData) => void;
  fillAddress: (coordinates: CafeFormData["coordinates"], address: string) => void;
  setEditing: (cafe: CafeFormData) => void;
  moveDraft: (coordinates: CafeFormData["coordinates"]) => void;
  closeEditor: () => void;
  clearCafes: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export type CafeStore = CafeState & CafeActions;

const upsert = (list: SavedCafe[], cafe: SavedCafe) => {
  const exists = list.some((item) => item.publicId === cafe.publicId);
  if (!exists) return [cafe, ...list];
  return list.map((item) => (item.publicId === cafe.publicId ? cafe : item));
};

const replaceCafe = (list: SavedCafe[], cafe: SavedCafe) =>
  list.map((item) => (item.publicId === cafe.publicId ? cafe : item));

const readCafe = async (response: Response) => {
  const body = (await response.json()) as { cafe?: SavedCafe; error?: string };
  if (!response.ok || !body.cafe) {
    throw new Error(body.error ?? "Cafe request failed");
  }
  return body.cafe;
};

export const initCafeStore = (
  cafes?: SavedCafe[] | null,
  submissions?: SavedCafe[] | null,
): CafeState => ({
  cafes: cafes ?? [],
  submissions: submissions ?? [],
  cafesLoadState: loadStateFromServer(cafes !== null && cafes !== undefined),
  submissionsLoadState: loadStateFromServer(submissions !== null && submissions !== undefined),
  editing: null,
  editingVersion: 1,
  drawerMode: null,
  hasHydrated: false,
  saveError: null,
});

export const createCafeStore = (initialState: CafeState) => {
  return create<CafeStore>()(
    persist(
      (set) => ({
        ...initialState,
        fetchCafes: async () => {
          let shouldFetch = false;
          set(({ cafesLoadState }) => {
            const next = nextLoadStateForFetch(cafesLoadState);
            if (!next.shouldFetch) return {};
            shouldFetch = true;
            return { cafesLoadState: next.loadState };
          });
          if (!shouldFetch) return;

          try {
            const cafes = await fetchCollection<SavedCafe>("/api/cafes", "cafes", "Cafe");
            set({ cafes, cafesLoadState: "loaded" });
          } catch (error) {
            console.error("Unable to retrieve cafes", error);
            set({ cafesLoadState: "error" });
          }
        },
        fetchSubmissions: async () => {
          let shouldFetch = false;
          set(({ submissionsLoadState }) => {
            const next = nextLoadStateForFetch(submissionsLoadState);
            if (!next.shouldFetch) return {};
            shouldFetch = true;
            return { submissionsLoadState: next.loadState };
          });
          if (!shouldFetch) return;

          try {
            const submissions = await fetchCollection<SavedCafe>(
              "/api/cafes?submitted=true",
              "cafes",
              "Submission",
            );
            set({ submissions, submissionsLoadState: "loaded" });
          } catch (error) {
            console.error("Unable to retrieve submissions", error);
            set({ submissionsLoadState: "error" });
          }
        },
        saveCafe: async (cafe) => {
          set({ saveError: null });
          try {
            const response = await fetch("/api/cafes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cafe),
            });
            const saved = await readCafe(response);
            set((state) => ({
              cafes: upsert(state.cafes, saved),
              submissions: upsert(state.submissions, saved),
              editing: cafeToForm(saved),
              editingVersion: state.editingVersion + 1,
              saveError: null,
            }));
            return saved;
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to save place";
            set({ saveError: message });
            return null;
          }
        },
        setFavorite: async (publicId, favorite) => {
          const response = await fetch(`/api/cafes/${publicId}/favorite`, {
            method: favorite ? "POST" : "DELETE",
          });
          const saved = await readCafe(response);
          set((state) => ({
            cafes: replaceCafe(state.cafes, saved),
            submissions: replaceCafe(state.submissions, saved),
          }));
        },
        removeCafe: async (publicId) => {
          const response = await fetch(`/api/cafes/${publicId}`, { method: "DELETE" });
          if (!response.ok) {
            const body = (await response.json()) as { error?: string };
            throw new Error(body.error ?? "Unable to delete place");
          }
          set((state) => ({
            cafes: state.cafes.filter((cafe) => cafe.publicId !== publicId),
            submissions: state.submissions.filter((cafe) => cafe.publicId !== publicId),
            editing: state.editing?.publicId === publicId ? null : state.editing,
            drawerMode: state.editing?.publicId === publicId ? null : state.drawerMode,
          }));
        },
        openEditor: (cafe) =>
          set((state) => ({
            editing: cafe,
            editingVersion: state.editingVersion + 1,
            drawerMode: "view",
            saveError: null,
          })),
        openModify: (cafe) =>
          set((state) => ({
            editing: cafe,
            editingVersion: state.editingVersion + 1,
            drawerMode: "edit",
            saveError: null,
          })),
        fillAddress: (coordinates, address) =>
          set((state) => {
            const editing = state.editing;
            if (!editing || !address) return {};
            if (
              editing.coordinates.lat !== coordinates.lat ||
              editing.coordinates.lng !== coordinates.lng
            ) {
              return {};
            }
            const words = editing.address.trim().split(/\s+/).filter(Boolean);
            if (words.length >= 2) return {};
            return { editing: { ...editing, address } };
          }),
        setEditing: (cafe) => set({ editing: cafe }),
        moveDraft: (coordinates) =>
          set((state) => {
            if (state.editing?.publicId) return {};
            return {
              editing: {
                ...(state.editing ?? emptyCafeForm(coordinates)),
                coordinates,
              },
            };
          }),
        closeEditor: () => set({ editing: null, drawerMode: null, saveError: null }),
        clearCafes: () =>
          set({
            cafes: [],
            submissions: [],
            cafesLoadState: "idle",
            submissionsLoadState: "idle",
            editing: null,
            drawerMode: null,
            saveError: null,
          }),
        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      }),
      {
        name: "current-cafe",
        partialize: ({ editing }) => ({ editing }),
        merge: (persisted, current) => {
          const saved = persisted as Partial<CafeState>;
          if (current.editingVersion > 1) return current;
          return { ...current, ...saved };
        },
        onRehydrateStorage: () => (state, error) => {
          if (!error) state?.setHasHydrated(true);
        },
      },
    ),
  );
};

export const favoritesFrom = (cafes: SavedCafe[]) => cafes.filter((cafe) => cafe.favorite);

export type CafeStoreApi = ReturnType<typeof createCafeStore>;
