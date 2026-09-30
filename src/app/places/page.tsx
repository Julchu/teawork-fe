"use client";

import { favoritesFrom } from "@/stores/cafe-store";
import { PlaceCard, SignInPrompt } from "@/components/cafes/place-card";
import { useCafeStore } from "@/providers/cafe-store-provider";
import { useUserStore } from "@/providers/user-store-provider";

const PlacesPage = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const cafes = useCafeStore((state) => state.cafes);
  const submissions = useCafeStore((state) => state.submissions);
  const cafesLoadState = useCafeStore((state) => state.cafesLoadState);
  const submissionsLoadState = useCafeStore((state) => state.submissionsLoadState);
  const favorites = favoritesFrom(cafes);

  if (!userInfo) {
    return (
      <div className="px-4 pt-20">
        <SignInPrompt
          title="Places"
          detail="Sign in to see the places you submitted and the ones you favorited."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-4 pt-20 pb-6">
      <section className="flex flex-col gap-3">
        <h1 className="text-lg font-medium tracking-widest">Favorites</h1>
        {cafesLoadState === "loading" ? <p className="text-sm text-neutral-500">Loading places</p> : null}
        {cafesLoadState === "error" ? (
          <p className="text-sm text-red-600">Places could not be loaded.</p>
        ) : null}
        {favorites.length === 0 && cafesLoadState === "loaded" ? (
          <p className="text-sm text-neutral-500">Star a place from the map and it will show up here.</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {favorites.map((cafe) => (
            <PlaceCard key={cafe.publicId} cafe={cafe} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h1 className="text-lg font-medium tracking-widest">Submissions</h1>
        {submissionsLoadState === "error" ? (
          <p className="text-sm text-red-600">Submissions could not be loaded.</p>
        ) : null}
        {submissions.length === 0 && submissionsLoadState === "loaded" ? (
          <p className="text-sm text-neutral-500">
            Submit a place from the map to keep wifi, outlets, and the rest of the notes.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {submissions.map((cafe) => (
            <PlaceCard key={cafe.publicId} cafe={cafe} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default PlacesPage;
