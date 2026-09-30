import type { FilterSpecification, LightsSpecification, Map as MapboxMap, StyleSpecification, } from "mapbox-gl";

/** Official Mapbox Standard (not Studio forks). */
export const STANDARD_STYLE_URL = "mapbox://styles/mapbox/standard";
export const STANDARD_SATELLITE_STYLE_URL =
  "mapbox://styles/mapbox/standard-satellite";

const BASEMAP_IMPORT_ID = "basemap";
const STANDARD_POI_LAYER_ID = "poi-label";
/** Left in place so a hot reload can drop the circle layer from the previous session. */
const POI_DOT_LAYER_ID = "teawork-poi-dots";

const poiProperty = (field: string) =>
  [
    "downcase",
    ["to-string", ["coalesce", ["get", field], ""]],
  ] as FilterSpecification;

const includesText = (field: string, needle: string) =>
  [">=", ["index-of", needle, poiProperty(field)], 0] as FilterSpecification;

/**
 * Cafes, coffee, bakeries, coworking, libraries, and parks.
 * `food_and_drink` also contains restaurants and bars, so those stay out.
 */
const categoryFilter = [
  "any",
  [
    "in",
    poiProperty("maki"),
    ["literal", ["cafe", "bakery", "park", "library"]],
  ],
  ["==", poiProperty("class"), "park_like"],
  includesText("category_en", "cafe"),
  includesText("category_en", "café"),
  includesText("category_en", "coffee"),
  includesText("category_en", "cowork"),
  includesText("category_en", "co-work"),
  includesText("category_en", "library"),
  includesText("name", "cowork"),
  includesText("name", "co-work"),
  includesText("type", "cowork"),
  includesText("type", "co-work"),
] as FilterSpecification;

/**
 * `filterrank` is 0–5 (lower = more prominent).
 * Every matching work place stays eligible (`filterrank` <= 5). Labels may
 * overlap so collision does not drop them. From street level, Standard's budget
 * at the default density of 3:
 * zoom step -2, then -1 from z16, then 0 from z18,
 * plus class weight. Cafes and parks get a higher class weight than restaurants did.
 */
const POI_MIN_ZOOM = 13;
const STREET_ZOOM = 16;
const POI_DENSITY = 3;

const standardRankBudget = (classWeight: FilterSpecification) =>
  [
    "+",
    ["step", ["zoom"], -2, 16, -1, 18, 0],
    classWeight,
    POI_DENSITY,
  ] as FilterSpecification;

const standardRankFilter = [
  "case",
  ["<=", ["pitch"], 15],
  [
    "<=",
    ["to-number", ["get", "filterrank"], 5],
    standardRankBudget([
      "match",
      ["get", "class"],
      "park_like",
      4,
      "food_and_drink",
      3,
      "visitor_amenities",
      2,
      "store_like",
      3,
      "lodging",
      1,
      2,
    ]),
  ],
  [
    "<=",
    ["to-number", ["get", "filterrank"], 5],
    standardRankBudget([
      "match",
      ["get", "class"],
      "park_like",
      4,
      "food_and_drink",
      3,
      "visitor_amenities",
      1,
      "lodging",
      1,
      "religion",
      0,
      2,
    ]),
  ],
] as FilterSpecification;

const rankFilter = [
  "step",
  ["zoom"],
  ["<=", ["to-number", ["get", "filterrank"], 5], 5],
  STREET_ZOOM,
  standardRankFilter,
] as FilterSpecification;

/** Collision stays on. A smaller gap lets more of the same places through. */
const labelPadding = [
  "interpolate",
  ["linear"],
  ["zoom"],
  13,
  3,
  16,
  2,
  18,
  2,
] as FilterSpecification;

/** Same horizon cull Standard uses once the map is pitched. */
const horizonFilter = [
  "case",
  ["<=", ["pitch"], 40],
  true,
  [
    "step",
    ["pitch"],
    true,
    40,
    ["<", ["distance-from-center"], 1.2],
    50,
    ["<", ["distance-from-center"], 1],
    55,
    ["<", ["distance-from-center"], 0.8],
    60,
    ["<=", ["distance-from-center"], 0.6],
  ],
] as FilterSpecification;

const RANGE_LAYER_IDS = [
  "teawork-range-fill",
  "teawork-range-pulse-line",
  "teawork-range-halo",
  "teawork-range-line",
];
const RANGE_SOURCE_IDS = ["teawork-range", "teawork-range-pulse"];

const mapsWithViewListener = new WeakSet<MapboxMap>();

const removeRangeOverlay = (map: MapboxMap) => {
  for (const layerId of RANGE_LAYER_IDS) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  for (const sourceId of RANGE_SOURCE_IDS) {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
};

const buildPoiFilter = (): FilterSpecification =>
  ["all", categoryFilter, rankFilter, horizonFilter] as FilterSpecification;

/**
 * Extruded buildings, landmark models, and window facades stay on.
 * Trees, indoor maps, and lane-level roads stay off.
 */
const filterBasemapConfig = {
  showPointOfInterestLabels: true,
  show3dBuildings: true,
  show3dLandmarks: true,
  show3dFacades: true,
  show3dTrees: false,
  showIndoor: true,
  showHdRoads: true,
  // showPlaceLabels: true,
  // showRoadLabels: true,
  // showTransitLabels: true,
  // showLandmarkIcons: true,
  // showLandmarkIconLabels: true,
  // showIndoorLabels: true,

  //   showPedestrianRoads: true,
};

export const buildStandardStyle = (): StyleSpecification =>
  ({
    version: 8,
    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    sources: {},
    layers: [],
    imports: [
      {
        id: "basemap",
        url: STANDARD_STYLE_URL,
        config: filterBasemapConfig,
      },
    ],
  }) as StyleSpecification;

type BasemapStyle = {
  getOwnLayer: (layerId: string) => unknown;
  setFilter: (layerId: string, filter: FilterSpecification) => void;
  setLayoutProperty: (layerId: string, name: string, value: unknown) => void;
  setLayerZoomRange: (
    layerId: string,
    minzoom: number | null,
    maxzoom: number | null,
  ) => void;
  removeLayer: (layerId: string) => void;
  addLayer: (layer: object, beforeId?: string) => void;
};

/**
 * `Style.setFilter` on an imported style pauses that source until `Map#_update(true)`
 * runs. The map only does that on zoom, so a pan kept the previous POI set until scroll.
 */
const flushStyleUpdate = (map: MapboxMap) => {
  (map as MapboxMap & { _update?: (updateStyle: boolean) => void })._update?.(
    true,
  );
};

/**
 * Standard icons and text. These labels may overlap each other so collision
 * does not hide cafes and parks, and they do not knock out street names.
 */
const stylePoiLabels = (basemap: BasemapStyle) => {
  for (const name of ["text-allow-overlap", "icon-allow-overlap"]) {
    basemap.setLayoutProperty(STANDARD_POI_LAYER_ID, name, true);
  }
  for (const name of ["text-ignore-placement", "icon-ignore-placement"]) {
    basemap.setLayoutProperty(STANDARD_POI_LAYER_ID, name, true);
  }
  basemap.setLayoutProperty(
    STANDARD_POI_LAYER_ID,
    "text-padding",
    labelPadding,
  );
  basemap.setLayoutProperty(
    STANDARD_POI_LAYER_ID,
    "icon-padding",
    labelPadding,
  );
  basemap.setLayerZoomRange(STANDARD_POI_LAYER_ID, POI_MIN_ZOOM, 24);
};

type StyleWithImports = {
  fragments?: Array<{ id: string; style: BasemapStyle }>;
  getFragmentStyle?: (importId: string) => BasemapStyle | null | undefined;
  mergeLayers?: () => void;
};

const styleWithImports = (map: MapboxMap) =>
  (map as MapboxMap & { style?: StyleWithImports }).style;

const basemapStyle = (map: MapboxMap) => {
  const style = styleWithImports(map);
  if (!style) return null;
  return (
    style.getFragmentStyle?.(BASEMAP_IMPORT_ID) ??
    style.fragments?.find((fragment) => fragment.id === BASEMAP_IMPORT_ID)
      ?.style ??
    null
  );
};

const removeOwnedPoiOverlay = (map: MapboxMap) => {
  for (const layerId of ["teawork-poi-labels", "teawork-poi-highlight"]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  if (map.getSource("teawork-streets")) map.removeSource("teawork-streets");
};

const updatePoiView = (map: MapboxMap) => {
  const basemap = basemapStyle(map);
  if (!basemap?.getOwnLayer(STANDARD_POI_LAYER_ID)) return;
  try {
    basemap.setFilter(STANDARD_POI_LAYER_ID, buildPoiFilter());
  } catch (error) {
    console.warn("Failed to update POI view", error);
    return;
  }
  flushStyleUpdate(map);
};

const addCustomPoiOverlay = (map: MapboxMap) => {
  removeRangeOverlay(map);
  removeOwnedPoiOverlay(map);
  const basemap = basemapStyle(map);
  if (!basemap?.getOwnLayer(STANDARD_POI_LAYER_ID)) return;

  try {
    if (basemap.getOwnLayer(POI_DOT_LAYER_ID)) {
      basemap.removeLayer(POI_DOT_LAYER_ID);
      styleWithImports(map)?.mergeLayers?.();
    }
    stylePoiLabels(basemap);
    updatePoiView(map);
  } catch (error) {
    console.warn("Failed to attach Standard POI labels", error);
  }
};

/**
 * Standard's directional light renders a shadow map of every building.
 * That extra pass is most of the 3D cost. Building shading stays on.
 */
const disableBuildingShadows = (map: MapboxMap) => {
  try {
    const lights = map.getLights();
    if (!lights?.length) return;
    const relaxed: LightsSpecification[] = lights.map((light) => {
      if (light.type !== "directional") return light;
      return {
        ...light,
        properties: {
          ...light.properties,
          "cast-shadows": false,
          "shadow-intensity": 0,
        },
      };
    });
    map.setLights(relaxed);
  } catch {
    // Keep Standard's lighting if this GL JS build rejects the override.
  }
};

export const applyStandardOverrides = (map: MapboxMap) => {
  for (const [key, value] of Object.entries(filterBasemapConfig)) {
    try {
      map.setConfigProperty("basemap", key, value);
    } catch {
      // Ignore unsupported config keys on older GL JS builds.
    }
  }
  disableBuildingShadows(map);
  // Config updates can merge the basemap lights back in on the next frame.
  requestAnimationFrame(() => disableBuildingShadows(map));
  addCustomPoiOverlay(map);

  if (!mapsWithViewListener.has(map)) {
    mapsWithViewListener.add(map);
    map.once("idle", () => addCustomPoiOverlay(map));
  }
};