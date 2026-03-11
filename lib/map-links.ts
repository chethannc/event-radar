import type { EventItem } from "@/lib/sample-data";

export function getDirectionsUrl(event: EventItem) {
  const destination = `${event.coordinates.lat},${event.coordinates.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function getPlaceSearchUrl(event: EventItem) {
  const query = `${event.venue}, ${event.location}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=`;
}
