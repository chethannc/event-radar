export type DiscoverySourceType =
  | "instagram"
  | "event_website"
  | "reddit"
  | "college_page"
  | "meetup"
  | "community_forum";

export type DiscoveryQuery = {
  query: string;
  sourceType: DiscoverySourceType;
};

export type CandidateUrl = DiscoveryQuery & {
  url: string;
  title: string;
  snippet: string;
};

export type FetchedPageCandidate = CandidateUrl & {
  pageTitle: string;
  content: string;
  rawHtml: string;
  ticketLinks: string[];
};

export type ExtractedHiddenEvent = {
  event_title: string;
  event_description: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_category: string;
  ticket_link: string;
  source_website: string;
  event_start_iso?: string;
  uniqueness_score: number;
  popularity_signal_score: number;
  bangalore_relevance_score: number;
  ranking_reason: string;
};

export type HiddenDiscoveryRunResult = {
  searchedQueries: number;
  candidateUrls: number;
  fetchedPages: number;
  extractedEvents: number;
  storedEvents: number;
  duplicatesSkipped: number;
  currentHiddenDocs: number;
  errors: string[];
};
