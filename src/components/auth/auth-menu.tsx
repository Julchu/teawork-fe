"use client";

import Link from "next/link";
import { useUserStore } from "@/providers/user-store-provider";

export const AuthMenu = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const logout = useUserStore((state) => state.logout);

  return (
    <div className="absolute top-4 right-4 z-10 rounded-full bg-white/90 px-4 py-2 text-sm text-zinc-900 shadow">
      {userInfo ? (
        <button type="button" onClick={() => void logout()} className="cursor-pointer">
          {userInfo.name} · Log out
        </button>
      ) : (
        <Link href="/api/login">Sign in with Google</Link>
      )}
    </div>
  );
};
