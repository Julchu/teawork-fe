"use client";

import type { PropsWithChildren } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import type { CafeFormData } from "@/utils/interfaces";

const itemClass =
  "text-md flex h-8 cursor-pointer items-center rounded-md px-3 leading-none outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white";

const isSavedOrListed = (place: CafeFormData) => Boolean(place.publicId || place.name.trim());

export const PlaceContextMenu = ({
  children,
  menu,
  onView,
  onModify,
  onOpenChange,
}: PropsWithChildren<{
  menu: { x: number; y: number; place: CafeFormData } | null;
  onView: (place: CafeFormData) => void;
  onModify: (place: CafeFormData) => void;
  onOpenChange: (open: boolean) => void;
}>) => {
  const anchor = menu
    ? {
        getBoundingClientRect: () => new DOMRect(menu.x, menu.y, 0, 0),
      }
    : undefined;
  const place = menu?.place;

  return (
    <ContextMenu.Root open={menu !== null} onOpenChange={onOpenChange}>
      <ContextMenu.Trigger className="block h-full w-full">{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner anchor={anchor} className="z-50">
          <ContextMenu.Popup className="min-w-36 origin-(--transform-origin) rounded-md bg-white/95 p-1 text-neutral-950 shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35)] outline-none">
            {place && isSavedOrListed(place) ? (
              <>
                <ContextMenu.Item className={itemClass} onClick={() => onView(place)}>
                  View
                </ContextMenu.Item>
                <ContextMenu.Item className={itemClass} onClick={() => onModify(place)}>
                  Modify
                </ContextMenu.Item>
              </>
            ) : null}
            {place && !isSavedOrListed(place) ? (
              <ContextMenu.Item className={itemClass} onClick={() => onModify(place)}>
                Add place
              </ContextMenu.Item>
            ) : null}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
