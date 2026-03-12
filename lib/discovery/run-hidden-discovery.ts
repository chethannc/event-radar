import { createHash } from "node:crypto";

import { getAdminDb } from "@/lib/firebase-admin";
import { extractEventsFromPage } from "@/lib/discovery/extractor";
import { fetchCandidatePages, searchCandidateUrls } from "@/lib/discovery/search";
import type {
  ExtractedHiddenEvent,
  HiddenDiscoveryRunResult,
} from "@/lib/discovery/discovery-types";
import type { EventRecord } from "@/lib/sample-data";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeKey(title: string, date: string, location: string) {
  return `${title.toLowerCase().trim()}|${date.toLowerCase().trim()}|${location
    .toLowerCase()
    .trim()}`;
}

function toStableId(key: string) {
  return createHash("sha1").update(key).digest("hex").slice(0, 24);
}

function inferCategory(category: string): EventRecord["category"] {
  const normalized = category.toLowerCase();

  if (normalized.includes("tech")) return "Tech";
  if (normalized.includes("music")) return "Music";
  if (normalized.includes("trek")) return "Trekking";
  if (normalized.includes("run")) return "Running";
  if (normalized.includes("food")) return "Food";
  return "Networking";
}

function inferNeighborhood(location: string) {
  const normalized = location.toLowerCase();

  if (normalized.includes("koramangala")) return "Koramangala";
  if (normalized.includes("indiranagar")) return "Indiranagar";
  if (normalized.includes("mg road")) return "MG Road";
  if (normalized.includes("whitefield")) return "Whitefield";
  if (normalized.includes("hsr")) return "HSR Layout";
  if (normalized.includes("jayanagar")) return "Jayanagar";
  if (normalized.includes("jakkur")) return "Jakkur";
  if (normalized.includes("jp nagar")) return "JP Nagar";
  return "MG Road";
}

function inferCoordinates(neighborhood: string) {
  if (neighborhood === "Koramangala") return { lat: 12.9352, lng: 77.6245 };
  if (neighborhood === "Indiranagar") return { lat: 12.9784, lng: 77.6408 };
  if (neighborhood === "MG Road") return { lat: 12.9755, lng: 77.6065 };
  if (neighborhood === "Whitefield") return { lat: 12.9698, lng: 77.7499 };
  if (neighborhood === "HSR Layout") return { lat: 12.9121, lng: 77.6446 };
  if (neighborhood === "Jayanagar") return { lat: 12.925, lng: 77.5938 };
  if (neighborhood === "Jakkur") return { lat: 13.0783, lng: 77.5977 };
  if (neighborhood === "JP Nagar") return { lat: 12.9063, lng: 77.5857 };
  return { lat: 12.9716, lng: 77.5946 };
}

function parseVenueAndAddress(location: string) {
  const normalized = location.replace(/\s+/g, " ").trim();
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) {
    return {
      venue: "",
      address: "",
    };
  }

  if (parts.length === 1) {
    return {
      venue: parts[0],
      address: parts[0],
    };
  }

  return {
    venue: parts[0],
    address: parts.join(", "),
  };
}

async function geocodeLocation(query: string) {
  if (!query) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "BangaloreEventRadar/1.0 (hidden-event-discovery contact: support@example.com)",
        },
        next: { revalidate: 0 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;
    const firstResult = results[0];

    if (!firstResult?.lat || !firstResult?.lon) {
      return null;
    }

    return {
      lat: Number(firstResult.lat),
      lng: Number(firstResult.lon),
      displayName: firstResult.display_name ?? query,
    };
  } catch {
    return null;
  }
}

function fallbackImage(category: EventRecord["category"]) {
  if (category === "Tech") {
    return {
      imageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "People at a modern tech meetup with laptops and stage lighting",
    };
  }

  if (category === "Music") {
    return {
      imageUrl:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Crowd enjoying a live rooftop music session at night",
    };
  }

  if (category === "Trekking") {
    return {
      imageUrl:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Hikers on a sunrise trail surrounded by hills and trees",
    };
  }

  if (category === "Running") {
    return {
      imageUrl:
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Large group of runners after a community race event",
    };
  }

  if (category === "Food") {
    return {
      imageUrl:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Chef-led tasting table with plated food and guests",
    };
  }

  return {
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Professionals networking at a startup mixer event",
  };
}

function parseStartDate(event: ExtractedHiddenEvent) {
  if (event.event_start_iso) {
    const timestamp = Date.parse(event.event_start_iso);

    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  }

  const candidate = `${event.event_date} ${event.event_time} GMT+0530`.trim();
  const timestamp = Date.parse(candidate);

  if (!Number.isNaN(timestamp)) {
    return new Date(timestamp).toISOString();
  }

  return new Date().toISOString();
}

function addHours(isoString: string, hours: number) {
  const start = new Date(isoString);
  start.setHours(start.getHours() + hours);
  return start.toISOString();
}

function buildPopularityScore(event: ExtractedHiddenEvent) {
  return Math.round(
    event.uniqueness_score * 0.3 +
      event.popularity_signal_score * 0.3 +
      event.bangalore_relevance_score * 0.4,
  );
}

async function buildFirestoreEvent(event: ExtractedHiddenEvent) {
  const category = inferCategory(event.event_category);
  const { venue, address } = parseVenueAndAddress(event.event_location);
  const neighborhood = inferNeighborhood(address || event.event_location);
  const geocodedLocation = await geocodeLocation(
    `${address || event.event_location}, Bangalore`,
  );
  const coordinates =
    geocodedLocation ?? inferCoordinates(neighborhood);
  const image = fallbackImage(category);
  const startDate = parseStartDate(event);
  const popularity = buildPopularityScore(event);
  const dedupeKey = normalizeKey(
    event.event_title,
    event.event_date || startDate,
    event.event_location,
  );
  const id = toStableId(dedupeKey);

  return {
    id,
    slug: slugify(`${event.event_title}-${event.event_date || id}`),
    title: event.event_title,
    description: event.event_description,
    startDate,
    endDate: addHours(startDate, 2),
    location: geocodedLocation?.displayName || address || event.event_location,
    venue: venue || address || event.event_location,
    category,
    price: "See source",
    attendees: Math.max(24, Math.round(popularity * 1.5)),
    popularity,
    neighborhood,
    highlight: "Hidden Event",
    recommended: popularity >= 78,
    mapTop: "50%",
    mapLeft: "50%",
    ticketUrl: event.ticket_link || event.source_website,
    imageUrl: image.imageUrl,
    imageAlt: image.imageAlt,
    source: "Hidden Event Discovery Engine",
    sourceWebsite: event.source_website,
    discoveredBy: "AI",
    tags: ["Hidden Event", "AI Found"],
    hiddenEvent: true,
    aiRank: popularity,
    coordinates: {
      lat: coordinates.lat,
      lng: coordinates.lng,
    },
    date: event.event_date,
    time: event.event_time,
    discovered_by: "AI",
  };
}

function removeUndefinedFields<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export async function runHiddenEventDiscovery(): Promise<HiddenDiscoveryRunResult> {
  const db = getAdminDb();
  const errors: string[] = [];

  const { queries, candidates } = await searchCandidateUrls();
  const pages = await fetchCandidatePages(candidates);

  const extractedEvents: ExtractedHiddenEvent[] = [];
  for (const page of pages) {
    try {
      const pageEvents = await extractEventsFromPage(page);
      extractedEvents.push(...pageEvents);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown page extraction error",
      );
    }
  }

  if (!db) {
    return {
      searchedQueries: queries.length,
      candidateUrls: candidates.length,
      fetchedPages: pages.length,
      extractedEvents: extractedEvents.length,
      storedEvents: 0,
      duplicatesSkipped: 0,
      currentHiddenDocs: 0,
      errors: [
        ...errors,
        "Firestore admin credentials are not configured, so discovered events were not stored.",
      ],
    };
  }

  const snapshot = await db.collection("events").get();
  const existingKeys = new Set(
    snapshot.docs.map((doc) => {
      const data = doc.data() as {
        title?: string;
        startDate?: string;
        date?: string;
        location?: string;
      };

      return normalizeKey(
        data.title ?? "",
        data.date ?? data.startDate ?? "",
        data.location ?? "",
      );
    }),
  );

  let storedEvents = 0;
  let duplicatesSkipped = 0;

  for (const event of extractedEvents) {
    const firestoreEvent = await buildFirestoreEvent(event);
    const dedupeKey = normalizeKey(
      firestoreEvent.title,
      event.event_date || firestoreEvent.startDate,
      firestoreEvent.location,
    );

    if (existingKeys.has(dedupeKey)) {
      duplicatesSkipped += 1;
      continue;
    }

    try {
      await db
        .collection("events")
        .doc(firestoreEvent.id)
        .set(removeUndefinedFields(firestoreEvent), {
          merge: true,
        });
      existingKeys.add(dedupeKey);
      storedEvents += 1;
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `Firestore write failed for "${firestoreEvent.title}": ${error.message}`
          : `Firestore write failed for "${firestoreEvent.title}".`,
      );
    }
  }

  const hiddenSnapshot = await db
    .collection("events")
    .where("hiddenEvent", "==", true)
    .get();

  return {
    searchedQueries: queries.length,
    candidateUrls: candidates.length,
    fetchedPages: pages.length,
    extractedEvents: extractedEvents.length,
    storedEvents,
    duplicatesSkipped,
    currentHiddenDocs: hiddenSnapshot.size,
    errors,
  };
}
