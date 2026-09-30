import { create } from "zustand";
import type { CheckIn, Coordinates, UserInfo, UserPreferences } from "@/utils/interfaces";

export type UserState = {
  userInfo: UserInfo | null;
  lastLocation?: Coordinates;
  performanceMode: boolean;
};

export type UserActions = {
  setUser: (userInfo: UserInfo | null) => void;
  setPerformanceMode: (enabled: boolean) => void;
  checkIn: (entry: Omit<CheckIn, "id" | "checkedInAt">) => Promise<void>;
  logout: () => Promise<void>;
};

export type UserStore = UserState & UserActions;

export const initUserStore = (userInfo?: UserInfo | null): UserState => {
  return {
    userInfo: userInfo ?? null,
    lastLocation: userInfo?.preferences?.lastLocation,
    performanceMode: userInfo?.preferences?.performanceMode ?? false,
  };
};

export const defaultInitState: UserState = {
  userInfo: null,
  lastLocation: undefined,
  performanceMode: false,
};

const toPublicUser = (user: UserInfo) => ({
  name: user.name,
  email: user.email,
  image: user.image ?? null,
  preferences: user.preferences,
});

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveChain: Promise<void> = Promise.resolve();

const enqueueSave = (getUser: () => UserInfo | null) => {
  saveChain = saveChain
    .then(async () => {
      const user = getUser();
      if (!user) return;
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: toPublicUser(user) }),
      });
      if (!response.ok) {
        throw new Error("Unable to save preferences");
      }
    })
    .catch((error) => {
      console.error("Unable to save preferences", error);
    });
  return saveChain;
};

const queueSave = (getUser: () => UserInfo | null) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void enqueueSave(getUser);
  }, 800);
};

const applyPreferences = (
  user: UserInfo,
  preferences: UserPreferences,
): Pick<UserState, "userInfo" | "lastLocation" | "performanceMode"> => ({
  userInfo: { ...user, preferences },
  lastLocation: preferences.lastLocation,
  performanceMode: preferences.performanceMode,
});

export const createUserStore = (initialState: UserState = defaultInitState) => {
  return create<UserStore>((set, get) => ({
    userInfo: initialState.userInfo,
    lastLocation: initialState.lastLocation,
    performanceMode: initialState.performanceMode,
    setUser: (userInfo) =>
      set({
        userInfo,
        lastLocation: userInfo?.preferences?.lastLocation,
        performanceMode: userInfo?.preferences?.performanceMode ?? false,
      }),
    setPerformanceMode: (enabled) => {
      const user = get().userInfo;
      if (!user) {
        set({ performanceMode: enabled });
        return;
      }
      const preferences = { ...user.preferences, performanceMode: enabled };
      set(applyPreferences(user, preferences));
      queueSave(() => get().userInfo);
    },
    checkIn: async (entry) => {
      const user = get().userInfo;
      if (!user) return;

      const checkIn: CheckIn = {
        ...entry,
        id: crypto.randomUUID(),
        checkedInAt: new Date().toISOString(),
      };
      const preferences: UserPreferences = {
        ...user.preferences,
        lastLocation: entry.coordinates,
        checkIns: [checkIn, ...(user.preferences.checkIns ?? [])].slice(0, 100),
      };
      set(applyPreferences(user, preferences));
      if (saveTimer) clearTimeout(saveTimer);
      await enqueueSave(() => get().userInfo);
    },
    logout: async () => {
      if (saveTimer) clearTimeout(saveTimer);
      try {
        await fetch("/api/logout", { method: "POST" });
        set(() => ({ ...defaultInitState }));
      } catch (error) {
        throw new Error("Unable to logout", { cause: error });
      }
    },
  }));
};

export type UserStoreApi = ReturnType<typeof createUserStore>;
