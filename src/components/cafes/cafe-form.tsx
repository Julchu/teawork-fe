"use client";

import { useEffect, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useCafeStore } from "@/providers/cafe-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import {
  BathroomLock,
  type CafeFormData,
  emptyCafeForm,
  formToCafeBody,
  LocationValues,
} from "@/utils/interfaces";
import Link from "next/link";

const fieldClass =
  "text-md flex min-h-10 w-full rounded-md border border-gray-200 bg-white px-3 font-medium outline-none placeholder:font-normal placeholder:text-gray-400";

export const CafeForm = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const editing = useCafeStore((state) => state.editing);
  const editingVersion = useCafeStore((state) => state.editingVersion);
  const hasHydrated = useCafeStore((state) => state.hasHydrated);
  const saveError = useCafeStore((state) => state.saveError);
  const cafes = useCafeStore((state) => state.cafes);
  const saveCafe = useCafeStore((state) => state.saveCafe);
  const setEditing = useCafeStore((state) => state.setEditing);
  const setFavorite = useCafeStore((state) => state.setFavorite);
  const removeCafe = useCafeStore((state) => state.removeCafe);
  const closeEditor = useCafeStore((state) => state.closeEditor);

  const methods = useForm<CafeFormData>({
    defaultValues: editing ?? undefined,
  });
  const { register, handleSubmit, reset, watch, setValue, formState } = methods;
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const prevVersionRef = useRef<number | null>(null);
  const coordinatesRef = useRef(editing?.coordinates);
  coordinatesRef.current = editing?.coordinates;

  useEffect(() => {
    if (!hasHydrated || !editing) return;
    if (prevVersionRef.current === null || prevVersionRef.current !== editingVersion) {
      reset(editing);
      prevVersionRef.current = editingVersion;
      setDeleteError(null);
    }
  }, [editing, editingVersion, hasHydrated, reset]);

  const draftLat = editing?.coordinates.lat;
  const draftLng = editing?.coordinates.lng;

  useEffect(() => {
    if (draftLat === undefined || draftLng === undefined) return;
    setValue("coordinates", { lat: draftLat, lng: draftLng });
  }, [draftLat, draftLng, setValue]);

  useEffect(() => {
    if (!hasHydrated) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = watch((values) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const coordinates = coordinatesRef.current;
        if (!coordinates || !values.name) return;
        setEditing({
          ...emptyCafeForm(coordinates),
          ...(values as CafeFormData),
          coordinates,
        });
      }, 300);
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [hasHydrated, setEditing, watch]);

  const onSubmit: SubmitHandler<CafeFormData> = async (values) => {
    setDeleteError(null);
    await saveCafe(formToCafeBody(values));
  };

  const onFavorite = async () => {
    if (!editing?.publicId) return;
    const cafe = cafes.find((item) => item.publicId === editing.publicId);
    await setFavorite(editing.publicId, !cafe?.favorite);
  };

  const onDelete = async () => {
    if (!editing?.publicId) return;
    setDeleteError(null);
    try {
      await removeCafe(editing.publicId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete place");
    }
  };

  if (!editing) return null;

  const favorite = editing.publicId
    ? cafes.find((cafe) => cafe.publicId === editing.publicId)?.favorite
    : false;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-h-full flex-col gap-3 overflow-y-auto text-neutral-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium tracking-widest">
            {editing.publicId ? "Place" : "New place"}
          </h2>
          <p className="text-xs text-neutral-500">
            {editing.coordinates.lat.toFixed(5)}, {editing.coordinates.lng.toFixed(5)}
          </p>
        </div>
        <button type="button" onClick={closeEditor} className="text-sm text-neutral-500">
          Close
        </button>
      </div>

      {!userInfo ? (
        <Link href="/api/login" className="text-sm font-medium text-blue-600">
          Sign in with Google to submit this place
        </Link>
      ) : null}

      <label className="flex flex-col gap-1 text-xs tracking-widest text-neutral-500 uppercase">
        Name
        <input className={fieldClass} placeholder="Cafe name" {...register("name", { required: true })} />
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-widest text-neutral-500 uppercase">
        Address
        <input className={fieldClass} placeholder="Street address" {...register("address", { required: true })} />
      </label>
      <label className="flex flex-col gap-1 text-xs tracking-widest text-neutral-500 uppercase">
        Type
        <select className={fieldClass} {...register("type")}>
          {LocationValues.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs tracking-widest text-neutral-500 uppercase">Wifi</legend>
        <Check register={register} name="wifi.available" label="Available" />
        <input className={fieldClass} placeholder="Network name" {...register("wifi.name")} />
        <input className={fieldClass} placeholder="Password" {...register("wifi.password")} />
        <Check register={register} name="wifi.fast" label="Fast" />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-2">
        <Check register={register} name="outlet" label="Outlets" />
        <Check register={register} name="seating" label="Seating" />
        <Check register={register} name="clean" label="Clean" />
        <Check register={register} name="parking" label="Parking" />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs tracking-widest text-neutral-500 uppercase">Bathroom</legend>
        <Check register={register} name="bathroom.available" label="Available" />
        <Check register={register} name="bathroom.clean" label="Clean" />
        <select className={fieldClass} {...register("bathroom.locked")}>
          <option value="">No lock</option>
          <option value={BathroomLock.KEY}>Key</option>
          <option value={BathroomLock.CODE}>Code</option>
        </select>
      </fieldset>

      <fieldset className="grid grid-cols-3 gap-2">
        <Check register={register} name="busy.morning" label="Morning" />
        <Check register={register} name="busy.afternoon" label="Afternoon" />
        <Check register={register} name="busy.evening" label="Evening" />
      </fieldset>

      <input type="hidden" {...register("coordinates.lat", { valueAsNumber: true })} />
      <input type="hidden" {...register("coordinates.lng", { valueAsNumber: true })} />

      {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
      {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
      {formState.errors.name || formState.errors.address ? (
        <p className="text-sm text-red-600">Name and address are required.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={!userInfo || formState.isSubmitting}
          className="h-10 rounded-md bg-blue-500 px-4 text-sm tracking-widest disabled:opacity-50"
        >
          {formState.isSubmitting ? "Saving" : "Save"}
        </Button>
        {editing.publicId ? (
          <>
            <Button
              type="button"
              onClick={() => void onFavorite()}
              className="h-10 rounded-md bg-neutral-950 px-4 text-sm tracking-widest"
            >
              {favorite ? "Unfavorite" : "Favorite"}
            </Button>
            <Button
              type="button"
              onClick={() => void onDelete()}
              className="h-10 rounded-md bg-red-600 px-4 text-sm tracking-widest"
            >
              Delete
            </Button>
          </>
        ) : null}
      </div>
    </form>
  );
};

const Check = ({
  register,
  name,
  label,
}: {
  register: ReturnType<typeof useForm<CafeFormData>>["register"];
  name: Parameters<ReturnType<typeof useForm<CafeFormData>>["register"]>[0];
  label: string;
}) => {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-950">
      <input type="checkbox" {...register(name)} />
      {label}
    </label>
  );
};
