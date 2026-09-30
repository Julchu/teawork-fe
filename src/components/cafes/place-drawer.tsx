"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "@base-ui/react/drawer";
import { CafeForm } from "@/components/cafes/cafe-form";
import { Button } from "@/components/ui/button";
import { useCafeStore } from "@/providers/cafe-store-provider";
import { useUserStore } from "@/providers/user-store-provider";

const backdropClass =
  "fixed inset-0 z-40 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0";

const popupClass =
  "z-40 h-full w-[min(100%,24rem)] [transform:translateX(var(--drawer-swipe-movement-x))] overflow-y-auto overscroll-contain bg-white/95 p-4 text-neutral-950 shadow-xl transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none";

export const PlaceDrawer = () => {
  const drawerMode = useCafeStore((state) => state.drawerMode);
  const editing = useCafeStore((state) => state.editing);
  const closeEditor = useCafeStore((state) => state.closeEditor);
  const open = drawerMode !== null && editing !== null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) closeEditor();
      }}
      swipeDirection="right"
    >
      <Drawer.Portal>
        <Drawer.Backdrop className={backdropClass} />
        <Drawer.Viewport className="fixed inset-0 z-40 flex items-stretch justify-end">
          <Drawer.Popup className={popupClass}>
            {editing && drawerMode === "view" ? <PlaceView /> : null}
            {drawerMode === "edit" ? <CafeForm /> : null}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const detail = (label: string, value: string) => (
  <div>
    <dt className="text-xs tracking-widest text-neutral-500 uppercase">{label}</dt>
    <dd>{value}</dd>
  </div>
);

const PlaceView = () => {
  const editing = useCafeStore((state) => state.editing);
  const closeEditor = useCafeStore((state) => state.closeEditor);
  const userInfo = useUserStore((state) => state.userInfo);
  const checkIn = useUserStore((state) => state.checkIn);
  const [checkedInKey, setCheckedInKey] = useState<string | null>(null);
  if (!editing) return null;

  const placeKey = editing.publicId ?? `${editing.coordinates.lat},${editing.coordinates.lng}`;
  const checkedIn = checkedInKey === placeKey;
  const yesNo = (value: boolean) => (value ? "Yes" : "No");

  const onCheckIn = async () => {
    await checkIn({
      cafePublicId: editing.publicId,
      name: editing.name || "Checked in",
      address: editing.address,
      coordinates: editing.coordinates,
    });
    setCheckedInKey(placeKey);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <Drawer.Title className="text-lg font-medium tracking-widest">{editing.name}</Drawer.Title>
        <Drawer.Close onClick={closeEditor} className="text-sm text-neutral-500">
          Close
        </Drawer.Close>
      </div>
      <Drawer.Description className="text-sm text-neutral-500">
        {editing.address || "No address yet"}
      </Drawer.Description>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {detail("Type", editing.type)}
        {detail("Wifi", editing.wifi.available ? editing.wifi.name || "Yes" : "No")}
        {detail("Outlets", yesNo(editing.outlet))}
        {detail("Seating", yesNo(editing.seating))}
        {detail("Clean", yesNo(editing.clean))}
        {detail("Parking", yesNo(editing.parking))}
        {detail("Bathroom", yesNo(editing.bathroom.available))}
      </dl>
      {userInfo ? (
        <Button
          type="button"
          onClick={() => void onCheckIn()}
          disabled={checkedIn}
          className="h-10 w-fit rounded-md bg-neutral-950 px-4 text-sm tracking-widest"
        >
          {checkedIn ? "Checked in" : "Check in"}
        </Button>
      ) : (
        <Link href="/api/login" className="text-sm font-medium text-blue-600">
          Sign in to check in
        </Link>
      )}
      {editing.publicId ? null : (
        <p className="text-sm text-neutral-500">Right-click this place to add notes.</p>
      )}
    </div>
  );
};
