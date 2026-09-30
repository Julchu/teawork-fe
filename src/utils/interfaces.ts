export type Coordinates = { lat: number; lng: number };

export const MapStyle = {
  standard: "standard",
  grey: "grey",
  nav: "nav",
  satellite: "satellite",
  pink: "pink",
  streets: "streets",
} as const;

export type MapStyle = (typeof MapStyle)[keyof typeof MapStyle];

export const MapTime = {
  night: "night",
  dawn: "dawn",
  day: "day",
  dusk: "dusk",
} as const;

export type MapTime = (typeof MapTime)[keyof typeof MapTime];

export const Color = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type ColorMode = (typeof Color)[keyof typeof Color];

export type CheckIn = {
  id: string;
  cafePublicId?: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  checkedInAt: string;
};

export type UserPreferences = {
  colorMode: ColorMode;
  displayName: string;
  mapStyle?: string;
  performanceMode: boolean;
  lastLocation?: Coordinates;
  checkIns?: CheckIn[];
};

export type UserInfo = {
  id: number;
  publicId: string;
  email: string;
  name: string;
  image?: string | null;
  preferences: UserPreferences;
};

export type UserFormData = UserInfo;

export const LocationType = {
  CAFE: "cafe",
  RESTAURANT: "restaurant",
  COWORKING_SPACE: "coworking space",
  PATIO: "patio",
  OTHER: "other",
} as const;

export const LocationValues = [
  LocationType.CAFE,
  LocationType.RESTAURANT,
  LocationType.COWORKING_SPACE,
  LocationType.PATIO,
  LocationType.OTHER,
] as const;

export type LocationType = (typeof LocationValues)[number];

export type WifiType = {
  available: boolean;
  name: string;
  password: string;
  fast: boolean;
};

export const BathroomLock = {
  KEY: "key",
  CODE: "code",
} as const;

export type BathroomLockType = (typeof BathroomLock)[keyof typeof BathroomLock];

export type BathroomType = {
  available: boolean;
  clean: boolean;
  locked?: BathroomLockType;
};

export type BusyType = {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

export type CafeInput = {
  address: string;
  name: string;
  type: LocationType;
  coordinates: Coordinates;
  wifi: WifiType;
  outlet: boolean;
  bathroom: BathroomType;
  seating: boolean;
  clean: boolean;
  busy: BusyType;
  parking: boolean;
};

export type SavedCafe = CafeInput & {
  publicId: string;
  favorite: boolean;
};

export type CafeFormData = Omit<CafeInput, "bathroom"> & {
  publicId?: string;
  bathroom: {
    available: boolean;
    clean: boolean;
    locked: "" | BathroomLockType;
  };
};

export const emptyCafeForm = (coordinates: Coordinates): CafeFormData => ({
  name: "",
  address: "",
  type: LocationType.CAFE,
  coordinates,
  wifi: { available: false, name: "", password: "", fast: false },
  outlet: false,
  bathroom: { available: false, clean: false, locked: "" },
  seating: false,
  clean: false,
  busy: { morning: false, afternoon: false, evening: false },
  parking: false,
});

export const cafeToForm = (cafe: SavedCafe): CafeFormData => ({
  publicId: cafe.publicId,
  name: cafe.name,
  address: cafe.address,
  type: cafe.type,
  coordinates: cafe.coordinates,
  wifi: cafe.wifi,
  outlet: cafe.outlet,
  bathroom: {
    available: cafe.bathroom.available,
    clean: cafe.bathroom.clean,
    locked: cafe.bathroom.locked ?? "",
  },
  seating: cafe.seating,
  clean: cafe.clean,
  busy: cafe.busy,
  parking: cafe.parking,
});

export const formToCafeBody = (form: CafeFormData): CafeInput & { publicId?: string } => ({
  publicId: form.publicId,
  name: form.name.trim(),
  address: form.address.trim(),
  type: form.type,
  coordinates: form.coordinates,
  wifi: {
    available: form.wifi.available,
    name: form.wifi.name.trim(),
    password: form.wifi.password,
    fast: form.wifi.fast,
  },
  outlet: form.outlet,
  bathroom: {
    available: form.bathroom.available,
    clean: form.bathroom.clean,
    locked: form.bathroom.locked || undefined,
  },
  seating: form.seating,
  clean: form.clean,
  busy: form.busy,
  parking: form.parking,
});
