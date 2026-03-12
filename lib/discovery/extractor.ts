import type {
  ExtractedHiddenEvent,
  FetchedPageCandidate,
} from "@/lib/discovery/discovery-types";

type StructuredEventCandidate = Partial<ExtractedHiddenEvent> & {
  event_start_iso?: string;
};

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function inferCategoryFromText(input: string) {
  const normalized = input.toLowerCase();

  if (/tech|ai|startup|developer|product|founder/.test(normalized)) {
    return "Tech";
  }

  if (/music|gig|concert|dj|live/.test(normalized)) {
    return "Music";
  }

  if (/trek|trail|hike|outdoor/.test(normalized)) {
    return "Trekking";
  }

  if (/run|running|race|marathon|jog/.test(normalized)) {
    return "Running";
  }

  if (/food|dining|brunch|tasting|chef/.test(normalized)) {
    return "Food";
  }

  if (/network|meetup|mixer|community|founder/.test(normalized)) {
    return "Networking";
  }

  return "Networking";
}

function isGenericListingTitle(title: string) {
  const normalized = title.toLowerCase();

  return [
    "find events",
    "events & groups",
    "upcoming events",
    "things to do",
    "all-events",
    "allevents",
    "reddit",
    "the heart of the internet",
    "meetup",
    "instagram",
    "bookmyshow",
    "insider",
    "explore",
  ].some((term) => normalized.includes(term));
}

function isConcreteLocation(location: string) {
  const normalized = location.trim().toLowerCase();
  return normalized !== "" && normalized !== "bangalore" && normalized !== "bengaluru";
}

function isConcreteEvent(event: Partial<ExtractedHiddenEvent>) {
  return Boolean(
    event.event_title &&
      !isGenericListingTitle(event.event_title) &&
      (event.event_date || event.event_start_iso) &&
      event.event_location &&
      isConcreteLocation(event.event_location),
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseDateParts(isoString?: string) {
  if (!isoString) {
    return {
      event_date: "",
      event_time: "",
    };
  }

  const timestamp = Date.parse(isoString);
  if (Number.isNaN(timestamp)) {
    return {
      event_date: "",
      event_time: "",
    };
  }

  const date = new Date(timestamp);

  return {
    event_date: new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    event_time: new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function getMetaContent(html: string, names: string[]) {
  for (const name of names) {
    const propertyPattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const match = html.match(propertyPattern);

    if (match?.[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return "";
}

function flattenStructuredItems(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => flattenStructuredItems(item));
  }

  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;

    if (Array.isArray(record["@graph"])) {
      return flattenStructuredItems(record["@graph"]);
    }

    return [record];
  }

  return [];
}

function asText(value: unknown) {
  if (typeof value === "string") {
    return normalizeWhitespace(decodeHtmlEntities(value));
  }

  return "";
}

function getStructuredType(input: unknown): string {
  if (typeof input === "string") {
    return input.toLowerCase();
  }

  if (Array.isArray(input)) {
    return input.map((item) => getStructuredType(item)).join(" ");
  }

  return "";
}

function parseStructuredLocation(location: unknown) {
  if (typeof location === "string") {
    return asText(location);
  }

  if (!location || typeof location !== "object") {
    return "";
  }

  const record = location as Record<string, unknown>;
  const placeName = asText(record.name);
  const address = record.address;

  if (typeof address === "string") {
    return [placeName, asText(address)].filter(Boolean).join(", ");
  }

  if (address && typeof address === "object") {
    const addressRecord = address as Record<string, unknown>;
    const parts = [
      placeName,
      asText(addressRecord.streetAddress),
      asText(addressRecord.addressLocality),
      asText(addressRecord.addressRegion),
    ].filter(Boolean);

    return normalizeWhitespace(parts.join(", "));
  }

  return placeName;
}

function extractStructuredEventsFromHtml(page: FetchedPageCandidate) {
  const scriptPattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const candidates: StructuredEventCandidate[] = [];

  for (const match of page.rawHtml.matchAll(scriptPattern)) {
    const rawBlock = decodeHtmlEntities(match[1] ?? "").trim();

    if (!rawBlock) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawBlock) as unknown;
      const items = flattenStructuredItems(parsed);

      for (const item of items) {
        if (!item || typeof item !== "object") {
          continue;
        }

        const record = item as Record<string, unknown>;
        const type = getStructuredType(record["@type"]);

        if (!type.includes("event")) {
          continue;
        }

        const name = asText(record.name);
        const description = asText(record.description);
        const startIso = asText(record.startDate);
        const location = parseStructuredLocation(record.location);
        const category = inferCategoryFromText(
          `${name} ${description} ${page.pageTitle}`,
        );
        const offer = Array.isArray(record.offers)
          ? (record.offers[0] as Record<string, unknown> | undefined)
          : (record.offers as Record<string, unknown> | undefined);
        const ticketLink = asText(offer?.url) || page.ticketLinks[0] || page.url;
        const { event_date, event_time } = parseDateParts(startIso);

        candidates.push({
          event_title: name,
          event_description: description,
          event_date,
          event_time,
          event_location: location,
          event_category: category,
          ticket_link: ticketLink,
          source_website: page.url,
          event_start_iso: startIso,
          uniqueness_score: 74,
          popularity_signal_score: 62,
          bangalore_relevance_score: /bangalore|bengaluru/i.test(
            `${location} ${description} ${page.content}`,
          )
            ? 85
            : 60,
          ranking_reason: "Extracted from schema.org JSON-LD event metadata.",
        });
      }
    } catch {
      continue;
    }
  }

  return candidates;
}

function extractMetaFallbackEvent(page: FetchedPageCandidate) {
  const title =
    getMetaContent(page.rawHtml, ["og:title", "twitter:title"]) || page.pageTitle;
  const description =
    getMetaContent(page.rawHtml, ["og:description", "description"]) ||
    page.content.slice(0, 220);
  const startIso = getMetaContent(page.rawHtml, [
    "event:start_time",
    "article:published_time",
  ]);
  const location =
    getMetaContent(page.rawHtml, ["place:location:address"]) ||
    getMetaContent(page.rawHtml, ["og:locality"]) ||
    "";
  const { event_date, event_time } = parseDateParts(startIso);

  if (!title || isGenericListingTitle(title) || !location || !startIso) {
    return [];
  }

  return [
    {
      event_title: title,
      event_description: description,
      event_date,
      event_time,
      event_location: location,
      event_category: inferCategoryFromText(`${title} ${description}`),
      ticket_link: page.ticketLinks[0] || page.url,
      source_website: page.url,
      event_start_iso: startIso,
      uniqueness_score: 63,
      popularity_signal_score: 54,
      bangalore_relevance_score: 76,
      ranking_reason: "Extracted from event-oriented page metadata.",
    },
  ];
}

function heuristicExtraction(page: FetchedPageCandidate): ExtractedHiddenEvent[] {
  const combinedText = `${page.pageTitle} ${page.snippet} ${page.content}`.slice(
    0,
    5000,
  );

  if (
    !/bangalore|bengaluru/i.test(combinedText) ||
    isGenericListingTitle(page.pageTitle)
  ) {
    return [];
  }

  return [];
}

function normalizeExtractedEvents(
  page: FetchedPageCandidate,
  events: Array<Partial<ExtractedHiddenEvent>>,
) {
  return events
    .filter((event) => isConcreteEvent(event))
    .map((event) => ({
      event_title: event.event_title?.trim() ?? "",
      event_description: event.event_description?.trim() ?? "",
      event_date: event.event_date?.trim() ?? "",
      event_time: event.event_time?.trim() ?? "",
      event_location: event.event_location?.trim() ?? "Bangalore",
      event_category:
        event.event_category?.trim() ||
        inferCategoryFromText(`${page.pageTitle} ${page.content}`),
      ticket_link: event.ticket_link?.trim() || page.ticketLinks[0] || page.url,
      source_website: event.source_website?.trim() || page.url,
      event_start_iso: event.event_start_iso?.trim(),
      uniqueness_score: clampScore(Number(event.uniqueness_score)),
      popularity_signal_score: clampScore(Number(event.popularity_signal_score)),
      bangalore_relevance_score: clampScore(Number(event.bangalore_relevance_score)),
      ranking_reason:
        event.ranking_reason?.trim() ||
        "Ranked from page context and inferred Bangalore relevance.",
    }))
    .filter(
      (event) =>
        event.bangalore_relevance_score >= 50 &&
        event.event_title.length > 3,
    );
}

export async function extractEventsFromPage(page: FetchedPageCandidate) {
  const structuredEvents = normalizeExtractedEvents(page, [
    ...extractStructuredEventsFromHtml(page),
    ...extractMetaFallbackEvent(page),
  ]);

  if (structuredEvents.length > 0) {
    return structuredEvents;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return heuristicExtraction(page);
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
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract Bangalore events from noisy web pages. Return strict JSON with an `events` array. Each event item must have event_title, event_description, event_date, event_time, event_location, event_category, ticket_link, source_website, event_start_iso, uniqueness_score, popularity_signal_score, bangalore_relevance_score, and ranking_reason. Only include real Bangalore or Bengaluru events with a concrete title, date or ISO datetime, and a specific location. Do not include platform homepages, listing pages, subreddit pages, tag pages, or generic city event hubs. If the page does not describe a concrete event, return an empty events array.",
          },
          {
            role: "user",
            content: JSON.stringify({
              searchQuery: page.query,
              sourceType: page.sourceType,
              sourceWebsite: page.url,
              pageTitle: page.pageTitle,
              ticketLinks: page.ticketLinks,
              text: page.content,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI extraction failed");
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
      throw new Error("Empty extraction response");
    }

    const parsed = JSON.parse(rawContent) as {
      events?: Array<Partial<ExtractedHiddenEvent>>;
    };

    return normalizeExtractedEvents(page, parsed.events ?? []);
  } catch {
    return heuristicExtraction(page);
  }
}
