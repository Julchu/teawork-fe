"use client";

import { HistoryRow, SignInPrompt } from "@/components/cafes/place-card";
import { useUserStore } from "@/providers/user-store-provider";

const HistoryPage = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const checkIns = userInfo?.preferences.checkIns ?? [];

  if (!userInfo) {
    return (
      <div className="px-4 pt-20">
        <SignInPrompt
          title="History"
          detail="Sign in to keep a check-in log."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-4 pt-20 pb-6">
      <section className="flex flex-col gap-3">
        <h1 className="text-lg font-medium tracking-widest">Check-ins</h1>
        {checkIns.length === 0 ? (
          <p className="text-sm text-neutral-500">Check in from a place to start the log.</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {checkIns.map((checkIn) => (
            <HistoryRow
              key={checkIn.id}
              title={checkIn.name}
              detail={checkIn.address}
              when={checkIn.checkedInAt}
              lat={checkIn.coordinates.lat}
              lng={checkIn.coordinates.lng}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HistoryPage;
