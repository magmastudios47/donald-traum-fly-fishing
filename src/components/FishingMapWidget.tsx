"use client";

import React, { useEffect, useRef, useState } from "react";
import { DestinationItem } from "@/types/traum";
import { MapPin, Navigation, Compass, Waves, ExternalLink, Layers } from "lucide-react";

interface FishingMapWidgetProps {
  destinations: DestinationItem[];
  onSelectDestinationForBooking: (destinationName: string) => void;
}

const JUNIN_CENTER = {
  lat: -39.9506,
  lng: -71.0703,
  name: "Junín de los Andes (Base Operativa TRAUM)",
};

const MAP_LAYERS = {
  topo: {
    label: "Topográfico y Ríos",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ, OpenStreetMap",
  },
  satellite: {
    label: "Satélite Patagonia",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
  osm: {
    label: "Rutas y Caminos",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

export default function FishingMapWidget({
  destinations,
  onSelectDestinationForBooking,
}: FishingMapWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const tileLayerRef = useRef<unknown>(null);
  const markersLayerRef = useRef<unknown>(null);

  const [activeLayer, setActiveLayer] = useState<"topo" | "satellite" | "osm">("topo");
  const [selectedDest, setSelectedDest] = useState<DestinationItem | null>(
    destinations[0] || null
  );

  useEffect(() => {
    if (destinations.length > 0 && !selectedDest) {
      setSelectedDest(destinations[0]);
    } else if (selectedDest) {
      const updated = destinations.find((d) => d.id === selectedDest.id);
      if (updated) setSelectedDest(updated);
    }
  }, [destinations, selectedDest]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Ensure Leaflet CSS is loaded
      if (!document.getElementById("leaflet-css-cdn")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-cdn";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [JUNIN_CENTER.lat, JUNIN_CENTER.lng],
          zoom: 9,
          scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        const layerCfg = MAP_LAYERS[activeLayer];
        const tileLayer = L.tileLayer(layerCfg.url, {
          attribution: layerCfg.attribution,
          maxZoom: 17,
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;

        setTimeout(() => {
          map.invalidateSize();
        }, 250);
      }

      const map = mapInstanceRef.current as {
        flyTo: (coords: [number, number], zoom: number, opts?: { duration: number }) => void;
        invalidateSize: () => void;
      };
      const markersGroup = markersLayerRef.current as {
        clearLayers: () => void;
      };

      if (markersGroup) {
        markersGroup.clearLayers();
      }

      // Base Hub Marker: Junín de los Andes
      const hubIcon = L.divIcon({
        className: "traum-hub-marker",
        html: `<div style="background:#292D29;color:#D8CEB9;border:2px solid #D8CEB9;padding:4px 9px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,0.45);transform:translate(-50%,-50%);">★ Junín de los Andes</div>`,
        iconSize: [148, 26],
      });

      L.marker([JUNIN_CENTER.lat, JUNIN_CENTER.lng], { icon: hubIcon })
        .addTo(markersLayerRef.current as never)
        .bindPopup(
          `<strong>Junín de los Andes</strong><br/>Centro operativo de TRAUM Fly Cast en la Patagonia.`
        );

      // Destination Markers
      destinations.forEach((dest) => {
        if (typeof dest.lat !== "number" || typeof dest.lng !== "number") return;

        const pinIcon = L.divIcon({
          className: "traum-dest-marker",
          html: `<div style="display:flex;align-items:center;gap:5px;transform:translate(-14px,-14px);cursor:pointer;">
            <div style="width:28px;height:28px;border-radius:9999px;background:#263D32;border:2.5px solid #F2EFE6;box-shadow:0 4px 12px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;color:#D8CEB9;font-weight:700;font-size:12px;">●</div>
            <span style="background:rgba(38,61,50,0.92);color:#F2EFE6;padding:2px 7px;font-size:10px;font-weight:600;letter-spacing:0.08em;white-space:nowrap;border:1px solid rgba(216,206,185,0.4);box-shadow:0 2px 8px rgba(0,0,0,0.3);">${dest.name}</span>
          </div>`,
          iconSize: [160, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([dest.lat, dest.lng], { icon: pinIcon }).addTo(
          markersLayerRef.current as never
        );

        marker.on("click", () => {
          setSelectedDest(dest);
          map.flyTo([dest.lat, dest.lng], 11, { duration: 0.9 });
        });
      });
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [destinations]);

  // Switch tile layer cleanly when user toggles Topográfico / Satélite / Rutas
  const handleSwitchLayer = async (nextLayer: "topo" | "satellite" | "osm") => {
    setActiveLayer(nextLayer);
    if (!mapInstanceRef.current) return;
    const L = (await import("leaflet")).default;
    const map = mapInstanceRef.current as { removeLayer: (l: unknown) => void };
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = MAP_LAYERS[nextLayer];
    const newLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 17,
    }).addTo(mapInstanceRef.current as never);
    tileLayerRef.current = newLayer;
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleFocusDestination = (dest: DestinationItem) => {
    setSelectedDest(dest);
    if (
      mapInstanceRef.current &&
      typeof dest.lat === "number" &&
      typeof dest.lng === "number"
    ) {
      (
        mapInstanceRef.current as {
          flyTo: (coords: [number, number], zoom: number, opts: { duration: number }) => void;
        }
      ).flyTo([dest.lat, dest.lng], 11, { duration: 0.9 });
    }
  };

  return (
    <div className="mt-20 pt-16 border-t border-[#D8CEB9]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-[1px] bg-[#263D32]" />
            <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
              Cartografía interactiva · Referencia Junín de los Andes
            </span>
          </div>
          <h3 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#263D32]">
            Mapa de ríos y lagos de la{" "}
            <span className="italic text-[#746657]">cuenca del Neuquén.</span>
          </h3>
        </div>

        {/* Map Layer Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#746657] flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" />
            Vista:
          </span>
          {(["topo", "satellite", "osm"] as const).map((layerKey) => (
            <button
              key={layerKey}
              type="button"
              onClick={() => handleSwitchLayer(layerKey)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] font-medium border transition-colors cursor-pointer ${
                activeLayer === layerKey
                  ? "bg-[#263D32] text-[#F2EFE6] border-[#263D32]"
                  : "bg-white text-[#292D29] border-[#D8CEB9] hover:border-[#65745A]"
              }`}
            >
              {MAP_LAYERS[layerKey].label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector Pills */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {destinations.map((dest) => {
          const isSelected = selectedDest?.id === dest.id;
          return (
            <button
              key={dest.id}
              type="button"
              onClick={() => handleFocusDestination(dest)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.18em] font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? "bg-[#263D32] text-[#F2EFE6] border-[#263D32]"
                  : "bg-[#F2EFE6] text-[#292D29] border-[#D8CEB9] hover:border-[#65745A]"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#D8CEB9]" />
              <span>{dest.name}</span>
            </button>
          );
        })}
      </div>

      {/* Map + Active Spot Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Interactive Map Container (7 cols) */}
        <div className="lg:col-span-7 min-h-[420px] sm:min-h-[480px] border border-[#D8CEB9] shadow-lg relative overflow-hidden bg-[#D8CEB9]/30">
          <div
            ref={mapContainerRef}
            style={{ height: "480px", width: "100%" }}
            className="w-full h-full min-h-[420px] sm:min-h-[480px] z-10"
          />
        </div>

        {/* Active Location Details Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#263D32] text-[#F2EFE6] border border-[#65745A]/40 shadow-xl flex flex-col justify-between overflow-hidden">
          {selectedDest ? (
            <>
              <div>
                <div className="relative h-48 overflow-hidden bg-[#292D29]">
                  <img
                    src={selectedDest.imageUrl}
                    alt={selectedDest.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#263D32] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-[#292D29]/85 text-[#D8CEB9] text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Waves className="w-3 h-3" />
                    <span>{selectedDest.waterType || "Río / Lago"}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#D8CEB9] block mb-1">
                      {selectedDest.location}
                    </span>
                    <h4 className="font-editorial text-3xl text-[#F2EFE6]">
                      {selectedDest.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-[#D8CEB9] py-2 border-y border-[#899487]/25">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        <strong>Referencia:</strong>{" "}
                        {selectedDest.distanceFromJunin ||
                          "Zona Junín de los Andes"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                    {selectedDest.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedDest.modalities.map((mod) => (
                      <span
                        key={mod}
                        className="px-2.5 py-1 bg-[#292D29]/60 border border-[#899487]/35 text-[11px] text-[#D8CEB9]"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7 pt-0 space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onSelectDestinationForBooking(selectedDest.name)
                  }
                  className="w-full py-3.5 px-5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Contratar salida en {selectedDest.name}</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedDest.lat},${selectedDest.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 border border-[#899487]/40 text-[#D8CEB9] hover:bg-[#292D29]/60 text-[11px] uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Ver coordenadas en Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
