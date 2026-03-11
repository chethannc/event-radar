"use client";

import Link from "next/link";
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";

import type {
  RecommendationIntent,
  SuggestedFilters,
} from "@/lib/recommendation-types";
import type { EventItem } from "@/lib/sample-data";

type RecommendationPayload = {
  summary: string;
  events: EventItem[];
  source: "openai" | "fallback";
  detectedIntent: RecommendationIntent;
  followUpPrompts: string[];
  suggestedFilters: SuggestedFilters;
};

type AiPromptPanelProps = {
  prompts: string[];
  initialPrompt: string;
  initialResponse: string;
  initialRecommendedEvents: EventItem[];
  onSelectEvent?: (event: EventItem) => void;
  onApplySuggestedFilters?: (filters: SuggestedFilters) => void;
};

const DEFAULT_FILTERS: SuggestedFilters = {
  search: "",
  category: "All",
  neighborhood: "All Bengaluru",
  datePreset: "Any day",
  budget: "Any price",
};

function flattenIntent(intent: RecommendationIntent) {
  return [
    ...intent.categories,
    ...intent.neighborhoods,
    ...intent.timing,
    ...intent.budget,
  ];
}

function formatSuggestedFilters(filters: SuggestedFilters) {
  return [
    filters.category !== "All" ? filters.category : "",
    filters.neighborhood !== "All Bengaluru" ? filters.neighborhood : "",
    filters.datePreset !== "Any day" ? filters.datePreset : "",
    filters.budget !== "Any price" ? filters.budget : "",
    filters.search ? `Search: ${filters.search}` : "",
  ].filter(Boolean);
}

export function AiPromptPanel({
  prompts,
  initialPrompt,
  initialResponse,
  initialRecommendedEvents,
  onSelectEvent,
  onApplySuggestedFilters,
}: AiPromptPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [draftPrompt, setDraftPrompt] = useState(initialPrompt);
  const [response, setResponse] = useState(initialResponse);
  const [displayedResponse, setDisplayedResponse] = useState(initialResponse);
  const [recommendedEvents, setRecommendedEvents] = useState(
    initialRecommendedEvents,
  );
  const [source, setSource] = useState<"openai" | "fallback">("fallback");
  const [detectedIntent, setDetectedIntent] = useState<RecommendationIntent>({
    categories: [],
    neighborhoods: [],
    timing: [],
    budget: [],
  });
  const [suggestedFilters, setSuggestedFilters] =
    useState<SuggestedFilters>(DEFAULT_FILTERS);
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>(prompts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const detectedIntentChips = useMemo(
    () => flattenIntent(detectedIntent),
    [detectedIntent],
  );
  const suggestedFilterChips = useMemo(
    () => formatSuggestedFilters(suggestedFilters),
    [suggestedFilters],
  );
  const hasSuggestedFilters = suggestedFilterChips.length > 0;

  useEffect(() => {
    if (!response) {
      setDisplayedResponse("");
      return;
    }

    setDisplayedResponse("");
    let currentIndex = 0;
    const intervalId = window.setInterval(() => {
      currentIndex += 1;
      setDisplayedResponse(response.slice(0, currentIndex));

      if (currentIndex >= response.length) {
        window.clearInterval(intervalId);
      }
    }, 16);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [response]);

  async function runRecommendation(nextPrompt: string) {
    const trimmedPrompt = nextPrompt.trim();

    if (!trimmedPrompt) {
      setError("Enter a prompt to get AI recommendations.");
      return;
    }

    setPrompt(trimmedPrompt);
    setDraftPrompt(trimmedPrompt);
    setIsLoading(true);
    setError("");

    try {
      const recommendationResponse = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedPrompt }),
      });

      if (!recommendationResponse.ok) {
        throw new Error("Recommendation request failed.");
      }

      const result = (await recommendationResponse.json()) as RecommendationPayload;

      startTransition(() => {
        setResponse(result.summary);
        setRecommendedEvents(result.events);
        setSource(result.source);
        setDetectedIntent(result.detectedIntent);
        setSuggestedFilters(result.suggestedFilters);
        setFollowUpPrompts(
          result.followUpPrompts.length > 0 ? result.followUpPrompts : prompts,
        );
      });

      if (result.events[0]) {
        onSelectEvent?.(result.events[0]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unexpected recommendation error.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      id="ai-picks"
      className="surface-strong flex h-full flex-col rounded-[32px] p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            AI recommendation panel
          </p>
          <h2 className="mt-2 max-w-[18ch] text-[30px] font-semibold tracking-[-0.05em] text-foreground lg:text-[36px]">
            Ask for the exact vibe you want
          </h2>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          {source}
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runRecommendation(draftPrompt);
        }}
        className="mt-5 space-y-4"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--muted)]">
            Prompt
          </span>
          <textarea
            value={draftPrompt}
            onChange={(event) => setDraftPrompt(event.target.value)}
            rows={4}
            placeholder="free events tonight near Indiranagar"
            className="w-full rounded-[24px] border border-[color:var(--border)] bg-[var(--panel-dark)] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/40 focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#03111d] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Thinking..." : "Get recommendations"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftPrompt(initialPrompt);
              void runRecommendation(initialPrompt);
            }}
            className="rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-semibold text-foreground transition hover:border-[var(--accent)]"
          >
            Reset prompt
          </button>
          {hasSuggestedFilters ? (
            <button
              type="button"
              onClick={() => onApplySuggestedFilters?.(suggestedFilters)}
              className="rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)]"
            >
              Apply AI filters
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-5 space-y-3 rounded-[28px] border border-[color:var(--border)] bg-[var(--panel-dark)] p-4 text-white">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase tracking-[0.22em]">
            You
          </span>
          <div className="flex-1 rounded-2xl bg-white/8 px-4 py-3 text-sm leading-7 text-white/88">
            {prompt}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold uppercase tracking-[0.22em] text-white">
            AI
          </span>
          <div className="flex-1 rounded-2xl bg-white/8 px-4 py-3 text-sm leading-7 text-white/84">
            <motion.span
              key={response}
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {displayedResponse}
              {displayedResponse.length < response.length ? (
                <span className="ml-1 inline-block animate-pulse text-[var(--accent)]">
                  |
                </span>
              ) : null}
            </motion.span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {followUpPrompts.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setDraftPrompt(item);
              void runRecommendation(item);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              prompt === item
                ? "bg-[var(--accent)] text-white"
                : "border border-[color:var(--border)] bg-[var(--panel-strong)] text-[color:var(--muted)] hover:border-[var(--accent)] hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {detectedIntentChips.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Parsed intent
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {detectedIntentChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {suggestedFilterChips.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Suggested page filters
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedFilterChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-6 rounded-[24px] border border-[var(--accent-soft)] bg-[var(--accent-soft)]/50 p-6">
          <p className="text-sm font-medium text-foreground">
            Thinking through the best Bangalore matches...
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {recommendedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.35 }}
            className="rounded-[24px] border border-[var(--accent-soft)] bg-[var(--accent-soft)]/70 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  Recommended
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {event.title}
                </h3>
                <p className="mt-2 max-w-[28ch] text-base leading-7 text-[color:var(--muted)]">
                  {event.dateLabel} / {event.timeLabel} / {event.location}
                </p>
              </div>
              <span className="rounded-full border border-[var(--accent-soft)] bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                {event.highlight}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onSelectEvent?.(event)}
                className="rounded-full bg-[var(--panel-dark)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
              >
                Focus on map
              </button>
              <Link
                href={`/events/${event.slug}`}
                className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-foreground transition hover:border-[var(--accent)]"
              >
                View details
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
