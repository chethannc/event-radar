"use client";

import { motion } from "framer-motion";

type FilterBarProps = {
  search: string;
  category: string;
  neighborhood: string;
  datePreset: string;
  budget: string;
  categories: string[];
  neighborhoods: string[];
  datePresets: string[];
  budgetPresets: string[];
  activeFilters: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onDatePresetChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onClearFilters: () => void;
};

export function FilterBar({
  search,
  category,
  neighborhood,
  datePreset,
  budget,
  categories,
  neighborhoods,
  datePresets,
  budgetPresets,
  activeFilters,
  onSearchChange,
  onCategoryChange,
  onNeighborhoodChange,
  onDatePresetChange,
  onBudgetChange,
  onClearFilters,
}: FilterBarProps) {
  return (
    <section
      id="discover"
      className="surface sticky top-[92px] z-30 rounded-[28px] p-6"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Smart filters
            </p>
            <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-foreground lg:text-[36px]">
              Refine by mood, location, and timing
            </h2>
          </div>

          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:border-[var(--accent)] hover:text-foreground"
          >
            Clear filters
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Search
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tech meetups, rooftop gigs, breakfast circles"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--accent)]"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Neighborhood
            </span>
            <select
              value={neighborhood}
              onChange={(event) => onNeighborhoodChange(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--accent)]"
            >
              {neighborhoods.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Time
            </span>
            <select
              value={datePreset}
              onChange={(event) => onDatePresetChange(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--accent)]"
            >
              {datePresets.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Budget
            </span>
            <select
              value={budget}
              onChange={(event) => onBudgetChange(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--accent)]"
            >
              {budgetPresets.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.length > 0 ? (
            activeFilters.map((filter) => (
              <motion.span
                key={filter}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]"
              >
                {filter}
              </motion.span>
            ))
          ) : (
            <span className="text-sm text-[color:var(--muted)]">
              No active filters. Showing the full Bangalore event feed.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
