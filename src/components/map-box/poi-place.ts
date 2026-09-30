import type { GeoJSONFeature } from "mapbox-gl";
import {
  cafeToForm,
  type CafeFormData,
  type Coordinates,
  emptyCafeForm,
  type LocationType,
  type SavedCafe,
} from "@/utils/interfaces";

const distanceMeters = (from: Coordinates, to: Coordinates) => {
  const latRad = (from.lat * Math.PI) / 180;
  const dy = (from.lat - to.lat) * 111_320;
  const dx = (from.lng - to.lng) * 111_320 * Math.cos(latRad);
  return Math.hypot(dx, dy);
};

type MapFeature = GeoJSONFeature & {
  geometry: { type: string; coordinates: number[] };
  properties?: Record<string, unknown> | null;
};

const readFeature = (feature: GeoJSONFeature) => feature as MapFeature;

const textProp = (feature: GeoJSONFeature, key: string) => {
  const value = readFeature(feature).properties?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const ADDRESS_LAYER = /housenum|house-number|building-number|address-label|address_label/i;

const locationTypeFrom = (raw: string): LocationType => {
  const value = raw.toLowerCase();
  if (value.includes("cafe") || value.includes("coffee")) return "cafe";
  if (value.includes("cowork")) return "coworking space";
  if (value.includes("restaurant") || value.includes("food")) return "restaurant";
  return "other";
};

const matchNearestCafe = (cafes: SavedCafe[], coordinates: Coordinates, maxMeters: number) => {
  let closest: { cafe: SavedCafe; meters: number } | undefined;

  for (const cafe of cafes) {
    const meters = distanceMeters(coordinates, cafe.coordinates);
    if (meters > maxMeters) continue;
    if (!closest || meters < closest.meters) closest = { cafe, meters };
  }

  return closest?.cafe;
};

const matchSavedCafe = (cafes: SavedCafe[], coordinates: Coordinates, name: string) => {
  const target = name.trim().toLowerCase();
  let closest: { cafe: SavedCafe; meters: number } | undefined;

  for (const cafe of cafes) {
    const meters = distanceMeters(coordinates, cafe.coordinates);
    if (meters > 80) continue;
    const sameName = cafe.name.trim().toLowerCase() === target;
    if (!sameName && meters > 40) continue;
    if (!closest || meters < closest.meters) closest = { cafe, meters };
  }

  return closest?.cafe;
};

export const isAddressFeature = (feature: GeoJSONFeature) => {
  const layerId = feature.layer?.id ?? "";
  if (layerId.startsWith("teawork-poi")) return false;
  const sourceLayer = feature.sourceLayer ?? "";
  if (ADDRESS_LAYER.test(`${layerId} ${sourceLayer}`)) return true;
  const house = textProp(feature, "house_num") || textProp(feature, "housenumber");
  return house.length > 0;
};

export const placeFromAddress = (
  coordinates: Coordinates,
  feature: GeoJSONFeature,
  cafes: SavedCafe[],
): CafeFormData => {
  const saved = matchNearestCafe(cafes, coordinates, 40);
  if (saved) return cafeToForm(saved);

  const house = textProp(feature, "house_num") || textProp(feature, "housenumber");
  return {
    ...emptyCafeForm(coordinates),
    address: house,
  };
};

export const placeFromFeature = (
  feature: GeoJSONFeature,
  cafes: SavedCafe[],
): CafeFormData | null => {
  const geometry = readFeature(feature).geometry;
  if (geometry.type !== "Point") return null;
  const [lng, lat] = geometry.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const name = textProp(feature, "name_en") || textProp(feature, "name");
  if (!name) return null;

  const coordinates = { lat, lng };
  const saved = matchSavedCafe(cafes, coordinates, name);
  if (saved) return cafeToForm(saved);

  const type = locationTypeFrom(
    `${textProp(feature, "type")} ${textProp(feature, "maki")} ${textProp(feature, "class")}`,
  );

  return {
    ...emptyCafeForm(coordinates),
    name,
    address: textProp(feature, "address"),
    type,
  };
};
