import type { EventItem } from "@/lib/sample-data";
import type {
  RecommendationIntent,
  SuggestedFilters,
} from "@/lib/recommendation-types";

export type RecommendationResult = {
  summary: string;
  events: EventItem[];
  source: "openai" | "fallback";
  detectedIntent: RecommendationIntent;
  followUpPrompts: string[];
  suggestedFilters: SuggestedFilters;
};

const CATEGORY_RULES = [
  { test: /tech|ai|startup|product|developer|builder/, value: "Tech" },
  { test: /music|gig|concert|dj|rooftop/, value: "Music" },
  { test: /trek|trail|hike|outdoor|sunrise/, value: "Trekking" },
  { test: /run|running|marathon|race|jog/, value: "Running" },
  { test: /food|brunch|chef|tasting|dining/, value: "Food" },
  { test: /network|founder|investor|mixer|meetup/, value: "Networking" },
];

const NEIGHBORHOOD_RULES = [
  { test: /koramangala/, value: "Koramangala" },
  { test: /indiranagar/, value: "Indiranagar" },
  { test: /mg road|m\.g\. road/, value: "MG Road" },
  { test: /whitefield/, value: "Whitefield" },
  { test: /hsr|hsr layout/, value: "HSR Layout" },
  { test: /jayanagar/, value: "Jayanagar" },
  { test: /jakkur/, value: "Jakkur" },
  { test: /jp nagar/, value: "JP Nagar" },
];

function uniqueMatches(
  rules: Array<{ test: RegExp; value: string }>,
  input: string,
) {
  return rules
    .filter((rule) => rule.test.test(input))
    .map((rule) => rule.value)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function parsePriceValue(price: string) {
  if (price === "Free") {
    return 0;
  }

  const match = price.match(/(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function extractPriceLimit(query: string) {
  const match = query.match(
    /(under|below|less than|upto|up to)\s*rs\.?\s*(\d+)/,
  );

  if (!match) {
    return null;
  }

  return Number(match[2]);
}

function detectIntent(query: string): RecommendationIntent {
  const normalizedQuery = query.toLowerCase();
  const priceLimit = extractPriceLimit(normalizedQuery);
  const timing: string[] = [];
  const budget: string[] = [];

  if (normalizedQuery.includes("today")) {
    timing.push("Today");
  }

  if (
    normalizedQuery.includes("tonight") ||
    normalizedQuery.includes("this evening") ||
    normalizedQuery.includes("tonite")
  ) {
    timing.push("Tonight");
  }

  if (normalizedQuery.includes("weekend")) {
    timing.push("This weekend");
  }

  if (
    normalizedQuery.includes("after work") ||
    normalizedQuery.includes("evening")
  ) {
    timing.push("After work");
  }

  if (normalizedQuery.includes("morning") || normalizedQuery.includes("breakfast")) {
    timing.push("Morning");
  }

  if (normalizedQuery.includes("free")) {
    budget.push("Free");
  }

  if (priceLimit !== null) {
    if (priceLimit <= 500) {
      budget.push("Under Rs 500");
    } else if (priceLimit <= 1000) {
      budget.push("Under Rs 1000");
    }
  }

  if (
    budget.length === 0 &&
    (normalizedQuery.includes("cheap") || normalizedQuery.includes("budget"))
  ) {
    budget.push("Under Rs 1000");
  }

  return {
    categories: uniqueMatches(CATEGORY_RULES, normalizedQuery),
    neighborhoods: uniqueMatches(NEIGHBORHOOD_RULES, normalizedQuery),
    timing: timing.filter(
      (value, index, values) => values.indexOf(value) === index,
    ),
    budget: budget.filter(
      (value, index, values) => values.indexOf(value) === index,
    ),
  };
}

function buildSuggestedFilters(
  query: string,
  detectedIntent: RecommendationIntent,
): SuggestedFilters {
  return {
    search: detectedIntent.categories.length === 0 ? query.trim() : "",
    category: detectedIntent.categories[0] ?? "All",
    neighborhood: detectedIntent.neighborhoods[0] ?? "All Bengaluru",
    datePreset:
      detectedIntent.timing.find((timing) =>
        ["Today", "Tonight", "This weekend", "After work"].includes(timing),
      ) ?? "Any day",
    budget:
      detectedIntent.budget.find((budget) =>
        ["Free", "Under Rs 500", "Under Rs 1000"].includes(budget),
      ) ?? "Any price",
  };
}

function matchesTiming(event: EventItem, detectedIntent: RecommendationIntent) {
  if (detectedIntent.timing.length === 0) {
    return true;
  }

  const isWeekend =
    event.dayLabel === "Saturday" || event.dayLabel === "Sunday";
  const isPm = event.timeLabel.includes("PM");
  const isAm = event.timeLabel.includes("AM");

  return detectedIntent.timing.some((timing) => {
    if (timing === "Today") {
      return event.dayLabel === "Friday";
    }

    if (timing === "Tonight") {
      return isPm;
    }

    if (timing === "This weekend") {
      return isWeekend;
    }

    if (timing === "After work") {
      return isPm;
    }

    if (timing === "Morning") {
      return isAm;
    }

    return true;
  });
}

function matchesBudget(event: EventItem, detectedIntent: RecommendationIntent) {
  if (detectedIntent.budget.length === 0) {
    return true;
  }

  const numericPrice = parsePriceValue(event.price);

  return detectedIntent.budget.some((budget) => {
    if (budget === "Free") {
      return event.price === "Free";
    }

    if (budget === "Under Rs 500") {
      return numericPrice <= 500;
    }

    if (budget === "Under Rs 1000") {
      return numericPrice <= 1000;
    }

    return true;
  });
}

function exactMatchScore(event: EventItem, detectedIntent: RecommendationIntent) {
  let score = event.popularity;

  if (detectedIntent.categories.includes(event.category)) {
    score += 40;
  }

  if (detectedIntent.neighborhoods.includes(event.neighborhood)) {
    score += 35;
  }

  if (matchesTiming(event, detectedIntent)) {
    score += detectedIntent.timing.length > 0 ? 24 : 0;
  }

  if (matchesBudget(event, detectedIntent)) {
    score += detectedIntent.budget.length > 0 ? 20 : 0;
  }

  if (event.recommended) {
    score += 8;
  }

  return score;
}

function buildFollowUpPrompts(query: string, events: EventItem[]) {
  const topEvent = events[0];
  const base = query.trim();

  return [
    `${base} under Rs 1000`,
    topEvent ? `more like ${topEvent.title}` : "show networking alternatives",
    "free events tonight near Indiranagar",
  ].filter(Boolean);
}

function fallbackRecommendation(
  query: string,
  events: EventItem[],
): RecommendationResult {
  const detectedIntent = detectIntent(query);
  const suggestedFilters = buildSuggestedFilters(query, detectedIntent);
  const exactMatches = events.filter((event) => {
    const matchesCategory =
      detectedIntent.categories.length === 0 ||
      detectedIntent.categories.includes(event.category);
    const matchesNeighborhood =
      detectedIntent.neighborhoods.length === 0 ||
      detectedIntent.neighborhoods.includes(event.neighborhood);

    return (
      matchesCategory &&
      matchesNeighborhood &&
      matchesTiming(event, detectedIntent) &&
      matchesBudget(event, detectedIntent)
    );
  });

  const relaxedMatches = [...events]
    .sort(
      (left, right) =>
        exactMatchScore(right, detectedIntent) -
        exactMatchScore(left, detectedIntent),
    )
    .slice(0, 3);
  const recommended = (
    exactMatches.length > 0
      ? [...exactMatches].sort(
          (left, right) =>
            exactMatchScore(right, detectedIntent) -
            exactMatchScore(left, detectedIntent),
        )
      : relaxedMatches
  ).slice(0, 3);

  return {
    summary:
      exactMatches.length > 0
        ? "These picks match the strongest category, neighborhood, time, and budget signals in your prompt."
        : "No exact matches were available, so these are the closest Bangalore events based on vibe, location, timing, and budget fit.",
    events: recommended,
    source: "fallback",
    detectedIntent,
    followUpPrompts: buildFollowUpPrompts(query, recommended),
    suggestedFilters,
  };
}

export async function recommendEvents(
  query: string,
  events: EventItem[],
): Promise<RecommendationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallbackIntent = detectIntent(query);
  const fallbackFilters = buildSuggestedFilters(query, fallbackIntent);

  if (!apiKey) {
    return fallbackRecommendation(query, events);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You recommend Bangalore events. Return strict JSON with keys summary, slugs, detectedIntent, followUpPrompts, and suggestedFilters. slugs must contain only existing event slugs. suggestedFilters must use these defaults when unset: category='All', neighborhood='All Bengaluru', datePreset='Any day', budget='Any price', search=''.",
          },
          {
            role: "user",
            content: JSON.stringify({
              query,
              events: events.map((event) => ({
                slug: event.slug,
                title: event.title,
                category: event.category,
                date: event.startDate,
                location: event.location,
                neighborhood: event.neighborhood,
                price: event.price,
                description: event.description,
                highlight: event.highlight,
              })),
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI request failed");
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty OpenAI response");
    }

    const parsed = JSON.parse(rawContent) as {
      summary?: string;
      slugs?: string[];
      detectedIntent?: RecommendationIntent;
      followUpPrompts?: string[];
      suggestedFilters?: Partial<SuggestedFilters>;
    };
    const recommended = events.filter((event) =>
      parsed.slugs?.includes(event.slug),
    );

    if (recommended.length === 0) {
      throw new Error("No valid slugs returned");
    }

    return {
      summary:
        parsed.summary ??
        "These events best match the recommendation prompt.",
      events: recommended,
      source: "openai",
      detectedIntent: parsed.detectedIntent ?? fallbackIntent,
      followUpPrompts:
        parsed.followUpPrompts?.slice(0, 3) ??
        buildFollowUpPrompts(query, recommended),
      suggestedFilters: {
        ...fallbackFilters,
        ...parsed.suggestedFilters,
      },
    };
  } catch {
    return fallbackRecommendation(query, events);
  }
}
