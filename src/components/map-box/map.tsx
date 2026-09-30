"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "./map.css";
import mapBoxGL, {
  type Map as MapboxMap,
  type MapMouseEvent,
  type Marker,
} from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import {
  applyStandardOverrides,
  buildStandardStyle,
} from "@/components/map-box/standard-overrides";
import Controls from "@/components/map-box/controls";
import useMapHook from "@/hooks/use-map-hook";
import { useCafeStore } from "@/providers/cafe-store-provider";
import {
  type CafeFormData,
  cafeToForm,
  type Coordinates,
  type MapTime,
  type SavedCafe,
} from "@/utils/interfaces";
import {
  isAddressFeature,
  placeFromAddress,
  placeFromFeature,
} from "@/components/map-box/poi-place";

const hitBox = (point: { x: number; y: number }) =>
  [
    [point.x - 16, point.y - 16],
    [point.x + 16, point.y + 16],
  ] as [[number, number], [number, number]];

const pinSvg = (favorite: boolean) => {
  const fill = favorite ? "fill-amber-500" : "fill-blue-600";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="h-6 w-6 ${fill}">
    <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
  </svg>`;
};

const MapBoxMap = ({
  shouldUseDarkMode,
  initialCoords,
  mapTimeMode,
  onView,
  onModify,
  onAddressMenu,
}: {
  shouldUseDarkMode: boolean;
  mapTimeMode: MapTime;
  initialCoords: Coordinates;
  onView: (place: CafeFormData) => void;
  onModify: (place: CafeFormData) => void;
  onAddressMenu: (
    point: { x: number; y: number },
    place: CafeFormData | null,
  ) => void;
}) => {
  const cafes = useCafeStore((state) => state.cafes);
  const map = useRef<MapboxMap | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<Marker>();
  const cafeMarkers = useRef<globalThis.Map<string, Marker>>(
    new globalThis.Map(),
  );
  const cafesRef = useRef<SavedCafe[]>(cafes);
  const onViewRef = useRef(onView);
  const onModifyRef = useRef(onModify);
  const onAddressMenuRef = useRef(onAddressMenu);
  // TODO: clean up/optimize/fix React errors
  cafesRef.current = cafes;
  onViewRef.current = onView;
  onModifyRef.current = onModify;
  onAddressMenuRef.current = onAddressMenu;

  const [{ markers, addMarker, flyTo }] = useMapHook(
    map,
    mapLoading,
    setMapLoading,
    shouldUseDarkMode,
  );

  useEffect(() => {
    if (
      !map.current &&
      mapContainer.current !== null &&
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ) {
      try {
        mapBoxGL.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        map.current = new mapBoxGL.Map({
          attributionControl: false,
          container: mapContainer.current,
          center: [initialCoords.lng, initialCoords.lat],
          zoom: 15.5,
          antialias: true,
          fadeDuration: 0,
          crossSourceCollisions: false,
          performanceMetricsCollection: false,
          style: buildStandardStyle(),
        })
          .on("style.load", () => {
            if (!map.current) return;
            applyStandardOverrides(map.current);
            map.current.resize();
          })
          .on("idle", () => setMapLoading(false))
          .on("styledata", () => setMapLoading(false))
          .on("moveend", () => {
            setLocationLoading(false);
          });
      } catch (error) {
        console.error("Map failed to start", error);
        setMapLoading(false);
      }
    }
  }, [initialCoords.lat, initialCoords.lng, mapTimeMode]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const poiAt = (event: MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(hitBox(event.point), {
        target: { featuresetId: "poi", importId: "basemap" },
      });
      for (const feature of features) {
        const place = placeFromFeature(feature, cafesRef.current);
        if (place) return place;
      }
      return null;
    };

    const onClick = (event: MapMouseEvent) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".marker")) return;
      const place = poiAt(event);
      if (place) onViewRef.current(place);
    };

    const onContextMenu = (event: MapMouseEvent) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".marker")) return;
      event.preventDefault();

      const poi = poiAt(event);
      if (poi) {
        event.originalEvent.stopPropagation();
        onModifyRef.current(poi);
        return;
      }

      const addressFeature = mapInstance
        .queryRenderedFeatures(hitBox(event.point))
        .find(isAddressFeature);
      if (!addressFeature) {
        event.originalEvent.stopPropagation();
        onAddressMenuRef.current(
          { x: event.originalEvent.clientX, y: event.originalEvent.clientY },
          null,
        );
        return;
      }

      onAddressMenuRef.current(
        { x: event.originalEvent.clientX, y: event.originalEvent.clientY },
        placeFromAddress(
          { lat: event.lngLat.lat, lng: event.lngLat.lng },
          addressFeature,
          cafesRef.current,
        ),
      );
    };

    const onMouseMove = (event: MapMouseEvent) => {
      mapInstance.getCanvas().style.cursor = poiAt(event) ? "pointer" : "";
    };

    mapInstance.on("click", onClick);
    mapInstance.on("contextmenu", onContextMenu);
    mapInstance.on("mousemove", onMouseMove);

    return () => {
      mapInstance.off("click", onClick);
      mapInstance.off("contextmenu", onContextMenu);
      mapInstance.off("mousemove", onMouseMove);
      mapInstance.getCanvas().style.cursor = "";
    };
  }, [mapLoading]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const seen = new Set<string>();
    for (const cafe of cafes) {
      seen.add(cafe.publicId);
      const existing = cafeMarkers.current.get(cafe.publicId);
      if (existing) {
        existing.setLngLat([cafe.coordinates.lng, cafe.coordinates.lat]);
        existing.getElement().innerHTML = pinSvg(cafe.favorite);
        continue;
      }

      const element = document.createElement("div");
      element.className = "marker cursor-pointer";
      element.innerHTML = pinSvg(cafe.favorite);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        const match = cafesRef.current.find(
          (item) => item.publicId === cafe.publicId,
        );
        if (match) onViewRef.current(cafeToForm(match));
      });
      element.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const match = cafesRef.current.find(
          (item) => item.publicId === cafe.publicId,
        );
        if (!match) return;
        onModifyRef.current(cafeToForm(match));
      });

      const marker = new mapBoxGL.Marker({ element })
        .setLngLat([cafe.coordinates.lng, cafe.coordinates.lat])
        .addTo(mapInstance);
      cafeMarkers.current.set(cafe.publicId, marker);
    }

    for (const [publicId, marker] of cafeMarkers.current) {
      if (seen.has(publicId)) continue;
      marker.remove();
      cafeMarkers.current.delete(publicId);
    }
  }, [cafes, mapLoading]);

  useEffect(() => {
    const markersOnMap = cafeMarkers.current;
    return () => {
      for (const marker of markersOnMap.values()) marker.remove();
      markersOnMap.clear();
    };
  }, []);

  const flyAndUpdateUser = () => {
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        };
        flyTo(coords);

        if (map.current)
          addMarker(
            markers["location"],
            currentMarker,
            setCurrentMarker,
            coords,
            true,
          );

        map.current?.once("movestart", () => {
          setLocationLoading(true);
        });
      },
      (error) => {
        console.log("Error geolocating", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false },
    );
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden drop-shadow-lg ${
        shouldUseDarkMode ? "bg-slate-800" : "bg-gray-100"
      }`}
    >
      <div
        className={`h-full w-full ${locationLoading ? "animate-pulse" : ""}`}
        ref={mapContainer}
      />
      <Controls
        map={map}
        mapLoading={mapLoading}
        setMapLoading={setMapLoading}
        locationLoading={locationLoading}
        triggerGeolocator={flyAndUpdateUser}
        shouldUseDarkMode={shouldUseDarkMode}
      />
    </div>
  );
};

export default MapBoxMap;