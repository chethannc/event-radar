import type { EventItem } from "@/lib/sample-data";

function isHttpUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getPrimaryEventUrl(event: EventItem) {
  if (isHttpUrl(event.ticketUrl) && event.ticketUrl !== "#") {
    return event.ticketUrl;
  }

  if (isHttpUrl(event.sourceWebsite)) {
    return event.sourceWebsite;
  }

  return "";
}

export function getPrimaryEventCtaLabel(event: EventItem) {
  const primaryUrl = getPrimaryEventUrl(event);

  if (!primaryUrl) {
    return "";
  }

  if (
    isHttpUrl(event.ticketUrl) &&
    event.ticketUrl !== "#" &&
    event.ticketUrl !== event.sourceWebsite &&
    event.price !== "See source"
  ) {
    return "Open booking flow";
  }

  return "View source page";
}
