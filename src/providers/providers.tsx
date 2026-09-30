import type { PropsWithChildren } from "react";
import { CafeLoader } from "@/components/cafes/cafe-loader";
import { CafeStoreProvider } from "@/providers/cafe-store-provider";
import { UserStoreProvider } from "@/providers/user-store-provider";
import { serverFetch } from "@/utils/server-actions/server-fetch";
import type { SavedCafe, UserInfo } from "@/utils/interfaces";

export const Providers = async ({ children }: PropsWithChildren) => {
  const userInfo = await serverFetch<UserInfo>({ endpoint: "user" });
  const cafes = userInfo ? await serverFetch<SavedCafe[]>({ endpoint: "cafes" }) : null;
  const submissions = userInfo
    ? await serverFetch<SavedCafe[]>({ endpoint: "cafes?submitted=true" })
    : null;

  return (
    <UserStoreProvider userInfo={userInfo}>
      <CafeStoreProvider cafes={cafes} submissions={submissions}>
        <CafeLoader />
        {children}
      </CafeStoreProvider>
    </UserStoreProvider>
  );
};
