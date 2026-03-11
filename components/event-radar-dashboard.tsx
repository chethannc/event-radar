"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { AiPromptPanel } from "@/components/ai-prompt-panel";
import { BottomNav } from "@/components/bottom-nav";
import { EventCard } from "@/components/event-card";
import { FilterBar } from "@/components/filter-bar";
import { MapPreview } from "@/components/map-preview";
import { SiteHeader } from "@/components/site-header";
import { TrendingStrip } from "@/components/trending-strip";
import {
  budgetPresets,
  categories,
  datePresets,
  neighborhoods,
  stats,
  suggestionPrompts,
  type EventItem,
} from "@/lib/sample-data";
import type { SuggestedFilters } from "@/lib/recommendation-types";

type EventRadarDashboardProps = {
  events: EventItem[];
};

function filterByDate(event: EventItem, preset: string) {
  if (preset === "Any day") return true;
  if (preset === "Today") return event.dayLabel === "Friday";
  if (preset === "Tonight") return event.timeLabel.includes("PM");
  if (preset === "This weekend") {
    return event.dayLabel === "Saturday" || event.dayLabel === "Sunday";
  }
  if (preset === "After work") {
    return event.timeLabel.includes("PM");
  }
  return true;
}

function parsePriceValue(price: string) {
  if (price === "Free") {
    return 0;
  }

  const match = price.match(/(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function filterByBudget(event: EventItem, budget: string) {
  if (budget === "Any price") return true;
  if (budget === "Free") return event.price === "Free";

  const numericPrice = parsePriceValue(event.price);

  if (budget === "Under Rs 500") {
    return numericPrice <= 500;
  }

  if (budget === "Under Rs 1000") {
    return numericPrice <= 1000;
  }

  return true;
}

function buildAiResponse(prompt: string, recommendedEvents: EventItem[]) {
  const firstEvent = recommendedEvents[0];

  if (!firstEvent) {
    return "No strong matches yet. Try loosening one of the active filters or switching neighborhoods.";
  }

  const remainingTitles = recommendedEvents
    .slice(1)
    .map((event) => event.title)
    .join(" and ");

  if (!remainingTitles) {
    return `${firstEvent.title} best matches "${prompt.toLowerCase()}". It stands out for ${firstEvent.highlight.toLowerCase()} and low-friction timing.`;
  }

  return `${firstEvent.title} is your strongest match, followed by ${remainingTitles}. This set leans into ${firstEvent.highlight.toLowerCase()} and keeps the city travel radius tight.`;
}

export function EventRadarDashboard({
  events,
}: EventRadarDashboardProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [neighborhood, setNeighborhood] = useState("All Bengaluru");
  const [datePreset, setDatePreset] = useState("Any day");
  const [budget, setBudget] = useState("Any price");
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ber-theme");

    if (savedTheme !== "light" && savedTheme !== "dark") {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsDarkMode(savedTheme === "dark");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    document.documentElement.style.colorScheme = isDarkMode ? "dark" : "light";
    window.localStorage.setItem("ber-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !normalizedSearch ||
      `${event.title} ${event.description} ${event.venue} ${event.location}`
        .toLowerCase()
        .includes(normalizedSearch);
    const matchesCategory = category === "All" || event.category === category;
    const matchesNeighborhood =
      neighborhood === "All Bengaluru" || event.neighborhood === neighborhood;
    const matchesDate = filterByDate(event, datePreset);
    const matchesBudget = filterByBudget(event, budget);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesNeighborhood &&
      matchesDate &&
      matchesBudget
    );
  });

  const activeFilters = [
    category !== "All" ? category : "",
    neighborhood !== "All Bengaluru" ? neighborhood : "",
    datePreset !== "Any day" ? datePreset : "",
    budget !== "Any price" ? budget : "",
    deferredSearch ? `Search: ${deferredSearch}` : "",
  ].filter(Boolean);

  const trendingEvents = [...events]
    .sort((left, right) => right.popularity - left.popularity)
    .slice(0, 5);
  const recommendedEvents = filteredEvents
    .filter((event) => event.recommended)
    .slice(0, 3);
  const visibleEvents = filteredEvents;
  const selectedEvent =
    visibleEvents.find((event) => event.id === selectedEventId) ??
    visibleEvents[0];
  const initialPrompt = suggestionPrompts[0];
  const aiResponse = buildAiResponse(initialPrompt, recommendedEvents);

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setNeighborhood("All Bengaluru");
    setDatePreset("Any day");
    setBudget("Any price");
  }

  function applySuggestedFilters(filters: SuggestedFilters) {
    setSearch(filters.search);
    setCategory(filters.category);
    setNeighborhood(filters.neighborhood);
    setDatePreset(filters.datePreset);
    setBudget(filters.budget);
  }

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto min-h-screen max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />

        <SiteHeader
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((current) => !current)}
        />

        <section className="py-20">
          <div className="surface-strong relative overflow-hidden rounded-[36px] px-6 py-10 sm:px-8 lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,91,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_28%)]" />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.45], scale: [1, 1.08, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute left-12 top-10 h-48 w-48 rounded-full bg-[var(--accent)]/18 blur-3xl"
            />

            <div className="relative grid items-start gap-6 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  New Bangalore discovery experience
                </div>

                <div className="space-y-6">
                  <h1 className="max-w-[12ch] text-[40px] font-bold leading-[0.96] tracking-[-0.06em] text-foreground sm:text-[48px] lg:text-[56px]">
                    Discover Bangalore events in a product-grade interface.
                  </h1>
                  <p className="max-w-[62ch] text-base leading-7 text-[color:var(--muted)]">
                    Part city guide, part intelligent dashboard. Browse by
                    vibe, scan a live map, and let AI narrow the feed to the
                    rooms worth showing up for.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-[var(--panel-dark)] px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-[var(--accent)]">
                    Explore events
                  </button>
                  <button className="rounded-full border border-[color:var(--border)] bg-[var(--panel-strong)] px-5 py-3 text-sm font-semibold text-foreground transition hover:scale-[1.02] hover:border-[var(--accent)]">
                    View AI picks
                  </button>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  {stats.map((stat, index) => (
                    <motion.article
                      key={stat.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.4 }}
                      className="surface rounded-[28px] p-6"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-foreground">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        {stat.description}
                      </p>
                    </motion.article>
                  ))}
                </div>
              </div>

              <AiPromptPanel
                prompts={suggestionPrompts}
                initialPrompt={initialPrompt}
                initialResponse={aiResponse}
                initialRecommendedEvents={recommendedEvents}
                onSelectEvent={(event) => setSelectedEventId(event.id)}
                onApplySuggestedFilters={applySuggestedFilters}
              />
            </div>
          </div>
        </section>

        <div className="space-y-20 pb-24 md:pb-12">
          <TrendingStrip
            events={trendingEvents}
            onSelect={(event) => setSelectedEventId(event.id)}
          />

          <section className="space-y-6 py-20">
            <FilterBar
              search={search}
              category={category}
              neighborhood={neighborhood}
              datePreset={datePreset}
              budget={budget}
              categories={categories}
              neighborhoods={neighborhoods}
              datePresets={datePresets}
              budgetPresets={budgetPresets}
              activeFilters={activeFilters}
              onSearchChange={setSearch}
              onCategoryChange={setCategory}
              onNeighborhoodChange={setNeighborhood}
              onDatePresetChange={setDatePreset}
              onBudgetChange={setBudget}
              onClearFilters={clearFilters}
            />

            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                    Event feed
                  </p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-foreground lg:text-[36px]">
                    Clean, responsive event discovery
                  </h2>
                  <p className="mt-3 max-w-[60ch] text-base leading-7 text-[color:var(--muted)]">
                    Each card keeps the most important details visible at a
                    glance without crowding the layout.
                  </p>
                </div>
                <p className="text-sm text-[color:var(--muted)]">
                  {visibleEvents.length} events visible
                </p>
              </div>

              {visibleEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isHighlighted={selectedEvent?.id === event.id}
                      onHover={(nextEvent) => setSelectedEventId(nextEvent.id)}
                      onSelect={(nextEvent) => setSelectedEventId(nextEvent.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="surface flex min-h-[240px] items-center justify-center rounded-[28px] p-6 text-center">
                  <div className="max-w-lg">
                    <p className="text-lg font-semibold text-foreground">
                      No events match the current filters.
                    </p>
                    <p className="mt-3 text-base leading-7 text-[color:var(--muted)]">
                      Clear one or two filters, or use the AI panel to broaden
                      the recommendation logic.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 py-20 lg:grid-cols-[0.38fr_0.62fr]">
            <div className="space-y-6">
              <div className="max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  Map focus
                </p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-foreground lg:text-[36px]">
                  Spatial context without layout clutter
                </h2>
                <p className="mt-3 max-w-[58ch] text-base leading-7 text-[color:var(--muted)]">
                  Keep the selected event pinned while scanning neighborhood
                  density, timing, and category fit.
                </p>
              </div>

              <div className="surface rounded-[28px] p-6">
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  Selected event
                </span>
                {selectedEvent ? (
                  <>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                      {selectedEvent.title}
                    </h3>
                    <div className="mt-6 space-y-4 text-base text-[color:var(--muted)]">
                      <p>
                        {selectedEvent.dateLabel} / {selectedEvent.timeLabel}
                      </p>
                      <p>{selectedEvent.location}</p>
                      <p>{selectedEvent.highlight}</p>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
                    No event is selected because the current filters returned no
                    results.
                  </p>
                )}
              </div>
            </div>

            <MapPreview
              events={visibleEvents}
              selectedEvent={selectedEvent}
              onSelect={(event) => setSelectedEventId(event.id)}
            />
          </section>
        </div>
      </motion.main>

      <BottomNav />
    </>
  );
}
