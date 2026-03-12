"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { motion } from "framer-motion";

import type { EventItem } from "@/lib/sample-data";

type EventCardProps = {
  event: EventItem;
  isHighlighted?: boolean;
  onHover?: (event: EventItem) => void;
  onSelect?: (event: EventItem) => void;
};

export function EventCard({
  event,
  isHighlighted = false,
  onHover,
  onSelect,
}: EventCardProps) {
  const eventDate = new Date(event.startDate);
  const dayNumber = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
  }).format(eventDate);
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(eventDate);

  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onHoverStart={() => onHover?.(event)}
      onClick={() => onSelect?.(event)}
      className={`group relative flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border backdrop-blur-xl ${
        isHighlighted
          ? "border-[var(--accent)] bg-[var(--accent-soft)]/80 shadow-[0_28px_90px_rgba(99,91,255,0.22)]"
          : "surface"
      }`}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.imageAlt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,29,0.06),rgba(3,17,29,0.8))]" />
        <div className="absolute left-4 top-4 rounded-[22px] bg-white px-3 py-3 text-center text-slate-950 shadow-lg">
          <p className="text-[28px] font-bold leading-none">{dayNumber}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            {monthLabel}
          </p>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[rgba(3,17,29,0.76)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
              {event.category}
            </span>
            {event.hiddenEvent || event.discoveredBy === "AI" ? (
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#03111d]">
                AI Found
              </span>
            ) : null}
            {event.recommended ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
                Recommended
              </span>
            ) : null}
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950 shadow">
            {event.price}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[color:var(--muted)]">
            {event.venue}
          </p>
          <h3 className="max-w-[20ch] text-2xl font-semibold tracking-[-0.04em] text-foreground">
            {event.title}
          </h3>
        </div>

        <div className="mt-6 space-y-4 text-base">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Date
            </p>
            <p className="mt-1 text-base text-foreground">
              {event.dateLabel} / {event.timeLabel}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Location
            </p>
            <p className="mt-1 max-w-[26ch] text-base text-foreground">
              {event.location}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              <span>Popularity</span>
              <span>{event.popularity}%</span>
            </div>
            <div className="h-2 rounded-full bg-[color:var(--border)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${event.popularity}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-2 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-secondary))]"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Crowd
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {event.attendees} going
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <Link
            href={`/events/${event.slug}`}
            onClick={(eventObject) => eventObject.stopPropagation()}
            className="rounded-full bg-[var(--panel-dark)] px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--accent)]"
          >
            View details
          </Link>
          <button
            type="button"
            onClick={(eventObject) => {
              eventObject.stopPropagation();
              onSelect?.(event);
            }}
            className="rounded-full border border-[color:var(--border)] px-4 py-2.5 text-sm font-medium text-[color:var(--muted)] transition hover:border-[var(--accent)] hover:text-foreground"
          >
            Focus map
          </button>
        </div>
      </div>
    </motion.article>
  );
}
