import type { Coordinates } from "@/utils/interfaces";

type ReverseFeature = {
  properties?: {
    full_address?: string;
    name?: string;
    place_formatted?: string;
  };
};

export const addressIsSparse = (address: string) =>
  address.trim().split(/\s+/).filter(Boolean).length < 2;

export const reverseAddress = async (coordinates: Coordinates): Promise<string> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return "";

  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.searchParams.set("longitude", String(coordinates.lng));
  url.searchParams.set("latitude", String(coordinates.lat));
  url.searchParams.set("types", "address");
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const body = (await response.json()) as { features?: ReverseFeature[] };
    const properties = body.features?.[0]?.properties;
    if (!properties) return "";
    if (properties.full_address) return properties.full_address;
    if (properties.name && properties.place_formatted) {
      return `${properties.name}, ${properties.place_formatted}`;
    }
    return properties.name ?? "";
  } catch {
    return "";
  }
};
