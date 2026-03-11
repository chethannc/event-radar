"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";

import { getDirectionsUrl, getPlaceSearchUrl } from "@/lib/map-links";
import type { EventItem } from "@/lib/sample-data";

type LeafletMapCanvasProps = {
  events: EventItem[];
  selectedEvent: EventItem;
  onSelect?: (event: EventItem) => void;
};

type MapControllerProps = {
  selectedEvent: EventItem;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
};

type ClusterLayerProps = {
  events: EventItem[];
  selectedEvent: EventItem;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
  onSelect?: (event: EventItem) => void;
};

type ClusterProperties = {
  cluster?: boolean;
  cluster_id?: number;
  point_count?: number;
  eventId?: string;
};

function createEventIcon(active: boolean) {
  return L.divIcon({
    className: "event-marker-shell",
    html: `
      <div class="event-marker ${active ? "event-marker--active" : ""}">
        <div class="event-marker__glow"></div>
        <div class="event-marker__pin"></div>
      </div>
    `,
    iconSize: [42, 52],
    iconAnchor: [21, 52],
    popupAnchor: [0, -44],
  });
}

function createClusterIcon(count: number) {
  return L.divIcon({
    className: "event-cluster-shell",
    html: `
      <div class="event-cluster">
        <span>${count}</span>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

function MapController({
  selectedEvent,
  markerRefs,
}: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    const nextZoom = Math.max(map.getZoom(), 14);
    map.flyTo(
      [selectedEvent.coordinates.lat, selectedEvent.coordinates.lng],
      nextZoom,
      { duration: 0.8 },
    );

    const timeoutId = window.setTimeout(() => {
      markerRefs.current[selectedEvent.id]?.openPopup();
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map, markerRefs, selectedEvent]);

  return null;
}

function ClusterLayer({
  events,
  selectedEvent,
  markerRefs,
  onSelect,
}: ClusterLayerProps) {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds());
  const [zoom, setZoom] = useState(() => Math.round(map.getZoom()));

  useMapEvents({
    moveend() {
      setBounds(map.getBounds());
      setZoom(Math.round(map.getZoom()));
    },
    zoomend() {
      setBounds(map.getBounds());
      setZoom(Math.round(map.getZoom()));
    },
  });

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<ClusterProperties>({
      radius: 60,
      maxZoom: 18,
    });

    index.load(
      events.map((event) => ({
        type: "Feature" as const,
        properties: {
          eventId: event.id,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [event.coordinates.lng, event.coordinates.lat] as [
            number,
            number,
          ],
        },
      })),
    );

    return index;
  }, [events]);

  const clusters = useMemo(() => {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    return clusterIndex.getClusters(
      [southWest.lng, southWest.lat, northEast.lng, northEast.lat],
      zoom,
    );
  }, [bounds, clusterIndex, zoom]);

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates as [number, number];
        const properties = cluster.properties as ClusterProperties;

        if (properties.cluster) {
          return (
            <Marker
              key={`cluster-${properties.cluster_id}`}
              position={[lat, lng]}
              icon={createClusterIcon(properties.point_count ?? 0)}
              eventHandlers={{
                click: () => {
                  map.flyTo([lat, lng], Math.min(zoom + 2, 18), {
                    duration: 0.6,
                  });
                },
              }}
            />
          );
        }

        const event = events.find((item) => item.id === properties.eventId);

        if (!event) {
          return null;
        }

        return (
          <Marker
            key={event.id}
            position={[event.coordinates.lat, event.coordinates.lng]}
            icon={createEventIcon(event.id === selectedEvent.id)}
            eventHandlers={{
              click: () => onSelect?.(event),
            }}
            ref={(marker) => {
              markerRefs.current[event.id] = marker;
            }}
          >
            <Popup>
              <div className="space-y-2 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  {event.category}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {event.title}
                </p>
                <p className="text-slate-600">{event.location}</p>
                <p className="text-slate-600">
                  {event.dateLabel} / {event.timeLabel}
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href={getDirectionsUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--accent-strong)]"
                  >
                    Directions
                  </a>
                  <a
                    href={getPlaceSearchUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--accent-strong)]"
                  >
                    Venue details
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export function LeafletMapCanvas({
  events,
  selectedEvent,
  onSelect,
}: LeafletMapCanvasProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    function syncTheme() {
      const nextTheme =
        document.documentElement.dataset.theme === "light" ? "light" : "dark";
      setMapTheme(nextTheme);
    }

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const tileConfig = useMemo(() => {
    if (mapTheme === "light") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/">CARTO</a>',
      };
    }

    return {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/">CARTO</a>',
    };
  }, [mapTheme]);

  return (
    <MapContainer
      center={[selectedEvent.coordinates.lat, selectedEvent.coordinates.lng]}
      zoom={12}
      scrollWheelZoom={false}
      className="leaflet-map h-[420px] w-full"
    >
      <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
      <ClusterLayer
        events={events}
        selectedEvent={selectedEvent}
        markerRefs={markerRefs}
        onSelect={onSelect}
      />
      <MapController selectedEvent={selectedEvent} markerRefs={markerRefs} />
    </MapContainer>
  );
}
