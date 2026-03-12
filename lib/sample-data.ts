export type EventCategory =
  | "Tech"
  | "Music"
  | "Trekking"
  | "Running"
  | "Food"
  | "Networking";

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  price: string;
  description: string;
  attendees: number;
  popularity: number;
  neighborhood: string;
  highlight: string;
  recommended: boolean;
  mapTop: string;
  mapLeft: string;
  ticketUrl: string;
  imageUrl: string;
  imageAlt: string;
  source?: string;
  sourceWebsite?: string;
  discoveredBy?: string;
  tags?: string[];
  hiddenEvent?: boolean;
  aiRank?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export type EventItem = EventRecord & {
  dateLabel: string;
  dayLabel: string;
  timeLabel: string;
};

export const categories: Array<"All" | EventCategory> = [
  "All",
  "Tech",
  "Music",
  "Trekking",
  "Running",
  "Food",
  "Networking",
];

export const neighborhoods = [
  "All Bengaluru",
  "Koramangala",
  "Indiranagar",
  "MG Road",
  "Whitefield",
  "HSR Layout",
  "Jayanagar",
  "Jakkur",
  "JP Nagar",
];

export const datePresets = [
  "Any day",
  "Today",
  "Tonight",
  "This weekend",
  "After work",
];

export const budgetPresets = [
  "Any price",
  "Free",
  "Under Rs 500",
  "Under Rs 1000",
];

export const suggestionPrompts = [
  "Events for tech lovers this weekend",
  "Music nights near MG Road",
  "Best networking rooms for founders",
];

export const stats = [
  {
    label: "Curated events",
    value: "148",
    description:
      "Fresh picks grouped across Bangalore's highest-intent neighborhoods.",
  },
  {
    label: "AI match rate",
    value: "92%",
    description:
      "Recommendation UI surfaces stronger event-fit decisions in fewer clicks.",
  },
  {
    label: "Neighborhoods",
    value: "11",
    description:
      "Built around local context, not generic citywide search results.",
  },
];

export const sampleEvents: EventRecord[] = [
  {
    id: "1",
    slug: "ai-builders-saturday",
    title: "AI Builders Saturday",
    category: "Tech",
    startDate: "2026-03-15T10:00:00+05:30",
    endDate: "2026-03-15T16:00:00+05:30",
    location: "Koramangala, Bangalore",
    venue: "Startup District Hall",
    price: "Free",
    description:
      "Lightning talks, product demos, and applied AI discussions for operators, founders, and product teams.",
    attendees: 214,
    popularity: 94,
    neighborhood: "Koramangala",
    highlight: "Builder-heavy crowd",
    recommended: true,
    mapTop: "48%",
    mapLeft: "42%",
    ticketUrl: "https://example.com/ai-builders-saturday",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "People at a modern tech meetup with laptops and stage lighting",
    coordinates: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: "2",
    slug: "indie-music-rooftop-session",
    title: "Indie Music Rooftop Session",
    category: "Music",
    startDate: "2026-03-13T19:30:00+05:30",
    endDate: "2026-03-13T23:00:00+05:30",
    location: "MG Road, Bangalore",
    venue: "Skyline Social",
    price: "Rs 999",
    description:
      "A rooftop session with local indie artists, slow transitions into DJ sets, and skyline views after sunset.",
    attendees: 132,
    popularity: 88,
    neighborhood: "MG Road",
    highlight: "Sunset rooftop atmosphere",
    recommended: false,
    mapTop: "28%",
    mapLeft: "58%",
    ticketUrl: "https://example.com/indie-music-rooftop-session",
    imageUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Crowd enjoying a live rooftop music session at night",
    coordinates: { lat: 12.9755, lng: 77.6065 },
  },
  {
    id: "3",
    slug: "sunrise-nandi-trail",
    title: "Sunrise Nandi Trail",
    category: "Trekking",
    startDate: "2026-03-16T04:30:00+05:30",
    endDate: "2026-03-16T12:00:00+05:30",
    location: "Hebbal pickup for Nandi Hills",
    venue: "Hebbal Meetup Point",
    price: "Rs 1499",
    description:
      "A guided dawn trail with transport, breakfast, and a low-friction outdoor format for weekend groups.",
    attendees: 76,
    popularity: 81,
    neighborhood: "Jayanagar",
    highlight: "Weekend outdoor escape",
    recommended: false,
    mapTop: "20%",
    mapLeft: "30%",
    ticketUrl: "https://example.com/sunrise-nandi-trail",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hikers on a sunrise trail surrounded by hills and trees",
    coordinates: { lat: 13.0358, lng: 77.597 },
  },
  {
    id: "4",
    slug: "whitefield-food-lab",
    title: "Whitefield Food Lab",
    category: "Food",
    startDate: "2026-03-14T12:00:00+05:30",
    endDate: "2026-03-14T16:00:00+05:30",
    location: "Whitefield, Bangalore",
    venue: "The Courtyard Market",
    price: "Rs 499",
    description:
      "Experimental menus, chef counters, and small-batch tasting stations designed for all-day grazing.",
    attendees: 167,
    popularity: 85,
    neighborhood: "Whitefield",
    highlight: "Chef-led tastings",
    recommended: false,
    mapTop: "42%",
    mapLeft: "76%",
    ticketUrl: "https://example.com/whitefield-food-lab",
    imageUrl:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Chef-led tasting table with plated food and guests",
    coordinates: { lat: 12.9698, lng: 77.7499 },
  },
  {
    id: "5",
    slug: "blr-tech-founders-mixer",
    title: "BLR Tech Founders Mixer",
    category: "Networking",
    startDate: "2026-03-14T18:30:00+05:30",
    endDate: "2026-03-14T21:30:00+05:30",
    location: "Indiranagar, Bangalore",
    venue: "The Bangalore Room",
    price: "Rs 799",
    description:
      "A high-signal mixer for startup founders, investors, and operators who want tighter introductions than usual city meetups.",
    attendees: 186,
    popularity: 91,
    neighborhood: "Indiranagar",
    highlight: "Founder-first intros",
    recommended: true,
    mapTop: "34%",
    mapLeft: "56%",
    ticketUrl: "https://example.com/blr-tech-founders-mixer",
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Professionals networking at a startup mixer event",
    coordinates: { lat: 12.9784, lng: 77.6408 },
  },
  {
    id: "6",
    slug: "product-leaders-breakfast",
    title: "Product Leaders Breakfast",
    category: "Tech",
    startDate: "2026-03-18T08:00:00+05:30",
    endDate: "2026-03-18T10:30:00+05:30",
    location: "HSR Layout, Bangalore",
    venue: "North Star Cafe",
    price: "Rs 599",
    description:
      "A small breakfast circle for product leaders covering AI-native roadmaps, PM hiring, and growth loops.",
    attendees: 94,
    popularity: 87,
    neighborhood: "HSR Layout",
    highlight: "Small-group format",
    recommended: true,
    mapTop: "64%",
    mapLeft: "44%",
    ticketUrl: "https://example.com/product-leaders-breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Small product leadership breakfast meeting at a cafe",
    coordinates: { lat: 12.9121, lng: 77.6446 },
  },
  {
    id: "7",
    slug: "apollo-jakkur-commitment-run-2026",
    title: "Apollo Sugar & Dental Clinics Jakkur Commitment Run 2026",
    category: "Running",
    startDate: "2026-03-15T07:00:00+05:30",
    endDate: "2026-03-15T10:30:00+05:30",
    location: "Jakkur Lake, Bangalore",
    venue: "Jakkur Lake",
    price: "Rs 299",
    description:
      "A city running event with 1 mile, 3K, 5K, and 7K formats designed for casual runners and goal-driven weekend crews.",
    attendees: 160,
    popularity: 90,
    neighborhood: "Jakkur",
    highlight: "High-energy lakefront run",
    recommended: false,
    mapTop: "14%",
    mapLeft: "48%",
    ticketUrl:
      "https://registrations.indiarunning.com/apollo_sugar__dental_clinics_jakkur_commitment_run_2026_24775",
    imageUrl:
      "https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Runners gathering at sunrise for a city lake run",
    coordinates: { lat: 13.085433916753738, lng: 77.61144656230826 },
  },
  {
    id: "8",
    slug: "pacex-hrx-mini-forest-run-jp-nagar",
    title: "PaceX x HRX Mini Forest Run at JP Nagar",
    category: "Running",
    startDate: "2026-03-15T06:15:00+05:30",
    endDate: "2026-03-15T09:00:00+05:30",
    location: "JP Nagar Mini Forest, Bangalore",
    venue: "JP Nagar Mini Forest",
    price: "Rs 399",
    description:
      "A community-first forest run that mixes short distances, recovery zones, and a social post-run atmosphere.",
    attendees: 250,
    popularity: 93,
    neighborhood: "JP Nagar",
    highlight: "Community running crowd",
    recommended: true,
    mapTop: "68%",
    mapLeft: "40%",
    ticketUrl: "https://example.com/pacex-hrx-mini-forest-run-jp-nagar",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Large group of runners posing after a community run in a park",
    coordinates: { lat: 12.9063, lng: 77.5857 },
  },
  {
    id: "9",
    slug: "sarakki-lake-run",
    title: "Sarakki Lake Run",
    category: "Running",
    startDate: "2026-03-29T07:00:00+05:30",
    endDate: "2026-03-29T10:00:00+05:30",
    location: "Sarakki Lake, Bangalore",
    venue: "Sarakki Lake",
    price: "Rs 299",
    description:
      "A scenic weekend lake run with family-friendly distance options and a softer pace for new runners.",
    attendees: 160,
    popularity: 89,
    neighborhood: "JP Nagar",
    highlight: "Beginner-friendly morning run",
    recommended: false,
    mapTop: "70%",
    mapLeft: "39%",
    ticketUrl: "https://example.com/sarakki-lake-run",
    imageUrl:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Runner celebrating near a lake during a morning race event",
    coordinates: { lat: 12.9006, lng: 77.5738 },
  },
];

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
  }).format(date);
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function toEventItem(event: EventRecord): EventItem {
  const start = new Date(event.startDate);

  return {
    ...event,
    dateLabel: formatDateLabel(start),
    dayLabel: formatDayLabel(start),
    timeLabel: formatTimeLabel(start),
  };
}

export const events = sampleEvents.map(toEventItem);
