"use client";

import { motion } from "framer-motion";

import type { EventItem } from "@/lib/sample-data";

type TrendingStripProps = {
  events: EventItem[];
  onSelect: (event: EventItem) => void;
};

export function TrendingStrip({ events, onSelect }: TrendingStripProps) {
  return (
    <section id="trending" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Trending now
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Momentum across Bangalore
          </h2>
        </div>
        <p className="hidden max-w-md text-sm leading-7 text-[color:var(--muted)] md:block">
          A horizontally scrollable rail designed like a startup discovery feed,
          with popularity built into the visual hierarchy.
        </p>
      </div>

      <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-1">
        {events.map((event, index) => (
          <motion.button
            key={event.id}
            type="button"
            onClick={() => onSelect(event)}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            whileHover={{ y: -6 }}
            className="surface min-w-[300px] flex-1 snap-start rounded-[28px] p-5 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[var(--panel-dark)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {event.category}
              </span>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                {event.popularity}% hot
              </span>
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-foreground">
              {event.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {event.description}
            </p>

            <div className="mt-5 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-foreground">{event.dateLabel}</p>
                <p className="mt-1 text-[color:var(--muted)]">{event.location}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Going
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {event.attendees}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
