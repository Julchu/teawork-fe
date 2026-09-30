"use client";

import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { useStore } from "zustand";
import { createCafeStore, initCafeStore, type CafeStore, type CafeStoreApi } from "@/stores/cafe-store";
import type { SavedCafe } from "@/utils/interfaces";

export const CafeStoreContext = createContext<CafeStoreApi | undefined>(undefined);

export type CafeStoreProviderProps = PropsWithChildren<{
  cafes?: SavedCafe[] | null;
  submissions?: SavedCafe[] | null;
}>;

export const CafeStoreProvider = ({ children, cafes, submissions }: CafeStoreProviderProps) => {
  const [cafeStore] = useState(() => createCafeStore(initCafeStore(cafes, submissions)));

  return <CafeStoreContext.Provider value={cafeStore}>{children}</CafeStoreContext.Provider>;
};

export const useCafeStore = <T,>(selector: (store: CafeStore) => T): T => {
  const cafeStoreContext = useContext(CafeStoreContext);

  if (!cafeStoreContext) {
    throw new Error("useCafeStore must be used within CafeStoreProvider");
  }

  return useStore(cafeStoreContext, selector);
};
