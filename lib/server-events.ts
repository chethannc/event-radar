import { getAdminDb } from "@/lib/firebase-admin";
import { recommendEvents } from "@/lib/openai";
import {
  toEventItem,
  type EventItem,
  type EventRecord,
} from "@/lib/sample-data";

function isEventCategory(value: string): value is EventRecord["category"] {
  return [
    "Tech",
    "Music",
    "Trekking",
    "Running",
    "Food",
    "Networking",
  ].includes(value);
}

function inferCategory(record: Partial<EventRecord>): EventRecord["category"] {
  const combined = `${record.title ?? ""} ${record.description ?? ""}`.toLowerCase();

  if (isEventCategory(String(record.category ?? ""))) {
    return record.category as EventRecord["category"];
  }

  if (/tech|ai|startup|developer|product|mongodb|grafana|sre|jfrog/.test(combined)) {
    return "Tech";
  }

  if (/music|gig|concert|live|dj/.test(combined)) {
    return "Music";
  }

  if (/trek|trail|hike|outdoor/.test(combined)) {
    return "Trekking";
  }

  if (/run|running|race|marathon|jog/.test(combined)) {
    return "Running";
  }

  if (/food|brunch|tasting|chef|dining/.test(combined)) {
    return "Food";
  }

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

function getFallbackImage(category: EventRecord["category"]) {
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

function parseStartDate(value?: string) {
  if (!value) {
    return "";
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? "" : new Date(timestamp).toISOString();
}

function addHours(isoString: string, hours: number) {
  const start = new Date(isoString);
  start.setHours(start.getHours() + hours);
  return start.toISOString();
}

function sanitizeRecord(record: Partial<EventRecord>): EventRecord | null {
  if (!record.id || !record.slug || !record.title) {
    return null;
  }

  const category = inferCategory(record);
  const startDate =
    parseStartDate(record.startDate) ||
    parseStartDate((record as { date?: string }).date) ||
    "";

  const isAiHidden = record.hiddenEvent === true || record.discoveredBy === "AI";
  const location = record.location ?? record.venue ?? "";
  const neighborhood = record.neighborhood ?? inferNeighborhood(location);
  const coordinates = record.coordinates ?? inferCoordinates(neighborhood);

  const hasMinimumFields =
    startDate &&
    location &&
    coordinates &&
    typeof coordinates.lat === "number" &&
    typeof coordinates.lng === "number";

  if (!hasMinimumFields && !isAiHidden) {
    return null;
  }

  if (!hasMinimumFields && isAiHidden) {
    return null;
  }

  const fallbackImage = getFallbackImage(category);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    category,
    startDate,
    endDate:
      parseStartDate(record.endDate) || addHours(startDate || new Date().toISOString(), 2),
    location,
    venue: record.venue ?? location,
    price: record.price ?? "See source",
    description: record.description ?? "AI-discovered Bangalore event.",
    attendees:
      typeof record.attendees === "number" ? record.attendees : 87,
    popularity:
      typeof record.popularity === "number"
        ? record.popularity
        : typeof record.aiRank === "number"
          ? record.aiRank
          : 58,
    neighborhood,
    highlight: record.highlight ?? (isAiHidden ? "Hidden Event" : "Curated pick"),
    recommended:
      typeof record.recommended === "boolean"
        ? record.recommended
        : isAiHidden,
    mapTop: record.mapTop ?? "50%",
    mapLeft: record.mapLeft ?? "50%",
    ticketUrl: record.ticketUrl ?? record.sourceWebsite ?? "#",
    imageUrl: record.imageUrl ?? fallbackImage.imageUrl,
    imageAlt: record.imageAlt ?? fallbackImage.imageAlt,
    source: record.source ?? (isAiHidden ? "Hidden Event Discovery Engine" : "Curated"),
    sourceWebsite: record.sourceWebsite,
    discoveredBy: record.discoveredBy,
    tags: record.tags ?? [],
    hiddenEvent: record.hiddenEvent ?? false,
    aiRank: record.aiRank,
    coordinates,
  };
}

export async function getEvents(): Promise<EventItem[]> {
  const db = getAdminDb();

  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection("events").orderBy("startDate").get();
    const firestoreEvents = snapshot.docs
      .map((doc) =>
        sanitizeRecord({
          id: doc.id,
          ...(doc.data() as Partial<EventRecord>),
        }),
      )
      .filter((event): event is EventRecord => Boolean(event))
      .map(toEventItem);

    return [...firestoreEvents].sort(
      (left, right) =>
        new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
    );
  } catch {
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  const events = await getEvents();
  return events.find((event) => event.slug === slug);
}

export async function getRecommendedEvents(query: string, events?: EventItem[]) {
  const allEvents = events ?? (await getEvents());
  return recommendEvents(query, allEvents);
}
