"use client";

import { useEffect } from "react";
import { useCafeStore } from "@/providers/cafe-store-provider";
import { useUserStore } from "@/providers/user-store-provider";

export const CafeLoader = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const cafesLoadState = useCafeStore((state) => state.cafesLoadState);
  const submissionsLoadState = useCafeStore((state) => state.submissionsLoadState);
  const fetchCafes = useCafeStore((state) => state.fetchCafes);
  const fetchSubmissions = useCafeStore((state) => state.fetchSubmissions);

  useEffect(() => {
    if (!userInfo) return;
    if (cafesLoadState === "idle") void fetchCafes();
    if (submissionsLoadState === "idle") void fetchSubmissions();
  }, [userInfo, cafesLoadState, submissionsLoadState, fetchCafes, fetchSubmissions]);

  return null;
};
