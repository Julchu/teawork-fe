"use client";

import { useState } from "react";
import MapBoxMap from "@/components/map-box/map";
import { PlaceContextMenu } from "@/components/cafes/place-context-menu";
import { PlaceDrawer } from "@/components/cafes/place-drawer";
import { addressIsSparse, reverseAddress } from "@/components/map-box/reverse-address";
import { useCafeStore } from "@/providers/cafe-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { type CafeFormData, MapTime, type Coordinates } from "@/utils/interfaces";

const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

export const MapWorkspace = ({ focus }: { focus?: Coordinates }) => {
  const lastLocation = useUserStore((state) => state.lastLocation);
  const openEditor = useCafeStore((state) => state.openEditor);
  const openModify = useCafeStore((state) => state.openModify);
  const fillAddress = useCafeStore((state) => state.fillAddress);
  const initialCoords = focus ?? lastLocation ?? DEFAULT_COORDS;
  const [menu, setMenu] = useState<{ x: number; y: number; place: CafeFormData } | null>(null);

  const viewPlace = (place: CafeFormData) => {
    openEditor(place);
    if (!addressIsSparse(place.address)) return;
    void reverseAddress(place.coordinates).then((address) => {
      if (address) fillAddress(place.coordinates, address);
    });
  };

  const modifyPlace = (place: CafeFormData) => {
    setMenu(null);
    if (!addressIsSparse(place.address)) {
      openModify(place);
      return;
    }
    void reverseAddress(place.coordinates).then((address) => {
      openModify(address ? { ...place, address } : place);
    });
  };

  return (
    <div className="relative h-full w-full">
      <PlaceContextMenu
        menu={menu}
        onView={viewPlace}
        onModify={modifyPlace}
        onOpenChange={(open) => {
          if (!open) setMenu(null);
        }}
      >
        <MapBoxMap
          shouldUseDarkMode={false}
          mapTimeMode={MapTime.day}
          initialCoords={initialCoords}
          onView={viewPlace}
          onModify={modifyPlace}
          onAddressMenu={(point, place) => setMenu(place ? { ...point, place } : null)}
        />
      </PlaceContextMenu>
      <PlaceDrawer />
    </div>
  );
};
