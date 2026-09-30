"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCafeStore } from "@/providers/cafe-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { cafeToForm, type SavedCafe } from "@/utils/interfaces";

export const SignInPrompt = ({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) => {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 rounded-md bg-white p-6 text-neutral-950 shadow">
      <h1 className="text-lg font-medium tracking-widest">{title}</h1>
      <p className="text-sm text-neutral-500">{detail}</p>
      <Link
        href="/api/login"
        className="inline-flex h-10 w-fit items-center rounded-md bg-blue-500 px-4 text-sm font-medium tracking-widest text-white"
      >
        Sign in with Google
      </Link>
    </div>
  );
};

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export const PlaceCard = ({ cafe }: { cafe: SavedCafe }) => {
  const router = useRouter();
  const openEditor = useCafeStore((state) => state.openEditor);
  const setFavorite = useCafeStore((state) => state.setFavorite);
  const checkIn = useUserStore((state) => state.checkIn);
  const [note, setNote] = useState<string | null>(null);

  const openOnMap = () => {
    openEditor(cafeToForm(cafe));
    router.push(`/?lat=${cafe.coordinates.lat}&lng=${cafe.coordinates.lng}`);
  };

  return (
    <article className="flex flex-col gap-3 rounded-md bg-white p-4 text-neutral-950 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium tracking-widest">{cafe.name}</h2>
          <p className="text-sm text-neutral-500">{cafe.address}</p>
          <p className="text-xs tracking-widest text-neutral-400 uppercase">{cafe.type}</p>
        </div>
        <button
          type="button"
          onClick={() => void setFavorite(cafe.publicId, !cafe.favorite)}
          className="text-sm tracking-widest text-blue-600"
        >
          {cafe.favorite ? "Favorited" : "Favorite"}
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600">
        <div>Wifi {cafe.wifi.available ? "yes" : "no"}</div>
        <div>Outlets {cafe.outlet ? "yes" : "no"}</div>
        <div>Seating {cafe.seating ? "yes" : "no"}</div>
        <div>Parking {cafe.parking ? "yes" : "no"}</div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openOnMap} className="text-sm tracking-widest text-blue-600">
          Open on map
        </button>
        <button
          type="button"
          className="text-sm tracking-widest text-blue-600"
          onClick={() => {
            void checkIn({
              cafePublicId: cafe.publicId,
              name: cafe.name,
              address: cafe.address,
              coordinates: cafe.coordinates,
            }).then(() => setNote("Checked in"));
          }}
        >
          Check in
        </button>
        {note ? <span className="text-sm text-neutral-500">{note}</span> : null}
      </div>
    </article>
  );
};

export const HistoryRow = ({
  title,
  detail,
  when,
  lat,
  lng,
}: {
  title: string;
  detail?: string;
  when: string;
  lat: number;
  lng: number;
}) => {
  return (
    <article className="flex items-center justify-between gap-3 rounded-md bg-white p-4 text-neutral-950 shadow">
      <div>
        <h2 className="font-medium tracking-widest">{title}</h2>
        {detail ? <p className="text-sm text-neutral-500">{detail}</p> : null}
        <p className="text-xs text-neutral-400">{formatWhen(when)}</p>
      </div>
      <Link
        href={`/?lat=${lat}&lng=${lng}`}
        className="text-sm tracking-widest text-blue-600"
      >
        Map
      </Link>
    </article>
  );
};
