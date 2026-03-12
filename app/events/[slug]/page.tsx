/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { MapPreview } from "@/components/map-preview";
import { getPrimaryEventCtaLabel, getPrimaryEventUrl } from "@/lib/event-links";
import { getDirectionsUrl, getPlaceSearchUrl } from "@/lib/map-links";
import { getEventBySlug, getEvents } from "@/lib/server-events";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const events = await getEvents();

  return events.map((event) => ({
    slug: event.slug,
  }));
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const primaryEventUrl = getPrimaryEventUrl(event);
  const primaryEventCtaLabel = getPrimaryEventCtaLabel(event);

  return (
    <main className="relative mx-auto min-h-screen max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />

      <div className="surface relative rounded-[28px] px-4 py-4">
        <Link
          href="/"
          className="inline-flex rounded-full border border-[color:var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold text-foreground transition hover:border-[var(--accent)]"
        >
          Back to events
        </Link>
      </div>

      <section className="surface-strong relative mt-6 overflow-hidden rounded-[36px] px-6 py-8 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,91,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-white/10">
              <div className="relative h-[280px] sm:h-[360px]">
                <img
                  src={event.imageUrl}
                  alt={event.imageAlt}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,29,0.12),rgba(3,17,29,0.76))]" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--panel-dark)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {event.category}
              </span>
              {event.hiddenEvent || event.discoveredBy === "AI" ? (
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#03111d]">
                  AI Found
                </span>
              ) : null}
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                {event.highlight}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.07em] text-foreground sm:text-6xl">
                {event.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
                {event.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="surface rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Schedule
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {event.dateLabel} / {event.timeLabel}
                </p>
              </div>

              <div className="surface rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Venue
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {event.venue}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {event.location}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={getDirectionsUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[var(--accent-strong)]"
                  >
                    Get directions
                  </a>
                  <a
                    href={getPlaceSearchUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[var(--accent-strong)]"
                  >
                    Venue details
                  </a>
                </div>
              </div>

              <div className="surface rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Ticketing
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {event.price}
                </p>
                {primaryEventUrl ? (
                  <a
                    href={primaryEventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full bg-[var(--panel-dark)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                  >
                    {primaryEventCtaLabel}
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    No booking or source link is available yet for this event.
                  </p>
                )}
              </div>

              <div className="surface rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {event.hiddenEvent || event.discoveredBy === "AI"
                    ? "Discovery source"
                    : "Popularity"}
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {event.hiddenEvent || event.discoveredBy === "AI"
                    ? event.source ?? "AI discovery engine"
                    : `${event.popularity}% hot`}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {event.hiddenEvent || event.discoveredBy === "AI"
                    ? event.sourceWebsite ?? "Web-discovered Bangalore event"
                    : `${event.attendees} people already on the list`}
                </p>
              </div>
            </div>
          </div>

          <MapPreview
            events={[event]}
            selectedEvent={event}
          />
        </div>
      </section>
    </main>
  );
}
