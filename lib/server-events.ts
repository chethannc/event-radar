import { getAdminDb } from "@/lib/firebase-admin";
import { recommendEvents } from "@/lib/openai";
import {
  sampleEvents,
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

function sanitizeRecord(record: Partial<EventRecord>): EventRecord | null {
  if (
    !record.id ||
    !record.slug ||
    !record.title ||
    !record.category ||
    !isEventCategory(record.category) ||
    !record.startDate ||
    !record.endDate ||
    !record.location ||
    !record.venue ||
    !record.price ||
    !record.description ||
    typeof record.attendees !== "number" ||
    typeof record.popularity !== "number" ||
    !record.neighborhood ||
    !record.highlight ||
    typeof record.recommended !== "boolean" ||
    !record.mapTop ||
    !record.mapLeft ||
    !record.ticketUrl ||
    !record.coordinates
  ) {
    return null;
  }

  const fallbackImage = getFallbackImage(record.category);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    category: record.category,
    startDate: record.startDate,
    endDate: record.endDate,
    location: record.location,
    venue: record.venue,
    price: record.price,
    description: record.description,
    attendees: record.attendees,
    popularity: record.popularity,
    neighborhood: record.neighborhood,
    highlight: record.highlight,
    recommended: record.recommended,
    mapTop: record.mapTop,
    mapLeft: record.mapLeft,
    ticketUrl: record.ticketUrl,
    imageUrl: record.imageUrl ?? fallbackImage.imageUrl,
    imageAlt: record.imageAlt ?? fallbackImage.imageAlt,
    coordinates: record.coordinates,
  };
}

export async function getEvents(): Promise<EventItem[]> {
  const db = getAdminDb();

  if (!db) {
    return sampleEvents.map(toEventItem);
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

    return firestoreEvents.length > 0
      ? firestoreEvents
      : sampleEvents.map(toEventItem);
  } catch {
    return sampleEvents.map(toEventItem);
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
