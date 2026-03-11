"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { getDirectionsUrl, getPlaceSearchUrl } from "@/lib/map-links";
import type { EventItem } from "@/lib/sample-data";

type MapPreviewProps = {
  events: EventItem[];
  selectedEvent?: EventItem;
  onSelect?: (event: EventItem) => void;
};

const LeafletMapCanvas = dynamic(
  () =>
    import("@/components/leaflet-map-canvas").then(
      (module) => module.LeafletMapCanvas,
    ),
  {
    ssr: false,
  },
);

export function MapPreview({
  events,
  selectedEvent,
  onSelect,
}: MapPreviewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  if (!selectedEvent || events.length === 0) {
    return (
      <aside
        id="map"
        className="surface-strong overflow-hidden rounded-[32px] p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Interactive map
            </p>
            <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-foreground lg:text-[36px]">
              OpenStreetMap with live event pins
            </h2>
          </div>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            0 live pins
          </span>
        </div>

        <div className="grid-overlay flex h-[420px] items-center justify-center rounded-[28px] border border-[color:var(--border)] bg-[var(--panel-dark)] px-6 text-center text-sm leading-7 text-white/70">
          No events match the current filters. Adjust the filters or ask AI for a
          broader set of recommendations.
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="map"
      className="surface-strong overflow-hidden rounded-[32px] p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Interactive map
          </p>
          <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-foreground lg:text-[36px]">
            OpenStreetMap with live event pins
          </h2>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          {events.length} live pins
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)]">
        {!isMounted ? (
          <div className="grid-overlay flex h-[420px] items-center justify-center bg-[var(--panel-dark)] text-sm text-white/70">
            Loading map...
          </div>
        ) : (
          <LeafletMapCanvas
            events={events}
            selectedEvent={selectedEvent}
            onSelect={onSelect}
          />
        )}
      </div>

      <motion.div
        key={selectedEvent.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-4 rounded-[24px] border border-white/12 bg-[var(--panel-dark)] p-4 text-white"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
              Selected event
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
              {selectedEvent.title}
            </h3>
            <p className="mt-2 text-sm text-white/72">
              {selectedEvent.location} / {selectedEvent.timeLabel}
            </p>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            {selectedEvent.highlight}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={getDirectionsUrl(selectedEvent)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#03111d] transition hover:opacity-90"
          >
            Get directions
          </a>
          <a
            href={getPlaceSearchUrl(selectedEvent)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--accent)]"
          >
            Venue details
          </a>
        </div>
      </motion.div>
    </aside>
  );
}
