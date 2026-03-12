import type {
  CandidateUrl,
  DiscoveryQuery,
  DiscoverySourceType,
  FetchedPageCandidate,
} from "@/lib/discovery/discovery-types";

const SEARCH_KEYWORDS = [
  "Bangalore event",
  "Bangalore meetup",
  "Bangalore live music",
  "Bangalore tech meetup",
  "Bangalore trek",
  "Bangalore workshop",
];

const SEARCH_SCOPES: Array<{
  sourceType: DiscoverySourceType;
  querySuffix: string;
}> = [
  { sourceType: "instagram", querySuffix: "site:instagram.com" },
  {
    sourceType: "event_website",
    querySuffix: "site:allevents.in OR site:bookmyshow.com",
  },
  {
    sourceType: "reddit",
    querySuffix: "site:reddit.com/r/bangalore OR site:reddit.com/r/bangaloreevents",
  },
  {
    sourceType: "college_page",
    querySuffix: "site:.edu OR site:.ac.in Bangalore fest event",
  },
  { sourceType: "meetup", querySuffix: "site:meetup.com Bangalore" },
  {
    sourceType: "community_forum",
    querySuffix: "site:insider.in OR site:townscript.com OR forum Bangalore",
  },
];

const SOURCE_SEEDS: CandidateUrl[] = [
  {
    query: "seed: allevents bangalore",
    sourceType: "event_website",
    url: "https://allevents.in/bangalore",
    title: "AllEvents Bangalore",
    snippet: "Bangalore events listing page",
  },
  {
    query: "seed: meetup bangalore",
    sourceType: "meetup",
    url: "https://www.meetup.com/find/?location=in--bangalore",
    title: "Meetup Bangalore",
    snippet: "Meetups and community events in Bangalore",
  },
  {
    query: "seed: reddit bangalore events",
    sourceType: "reddit",
    url: "https://www.reddit.com/r/bangalore/search/?q=meetup&restrict_sr=1&sort=new",
    title: "Reddit Bangalore meetup search",
    snippet: "Recent Bangalore meetup discussions on Reddit",
  },
  {
    query: "seed: bookmyshow bengaluru events",
    sourceType: "event_website",
    url: "https://in.bookmyshow.com/explore/events-bengaluru",
    title: "BookMyShow Bengaluru events",
    snippet: "Bengaluru event discovery page",
  },
  {
    query: "seed: instagram bangalore events",
    sourceType: "instagram",
    url: "https://www.instagram.com/explore/tags/bangaloreevents/",
    title: "Instagram Bangalore events tag",
    snippet: "Public Bangalore event posts on Instagram",
  },
  {
    query: "seed: insider bangalore",
    sourceType: "community_forum",
    url: "https://insider.in/all-events-in-bangalore",
    title: "Insider Bangalore events",
    snippet: "Bangalore event listings on Insider",
  },
  {
    query: "seed: india running bangalore",
    sourceType: "community_forum",
    url: "https://www.indiarunning.com/city/Bangalore",
    title: "India Running Bangalore",
    snippet: "Running events and races in Bangalore",
  },
];

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function parseDuckDuckGoResults(html: string, query: DiscoveryQuery) {
  const results: CandidateUrl[] = [];
  const anchorPattern =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetPattern =
    /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

  const snippets = Array.from(html.matchAll(snippetPattern)).map((match) =>
    stripHtml(match[1] ?? match[2] ?? ""),
  );

  let snippetIndex = 0;
  for (const match of html.matchAll(anchorPattern)) {
    const rawUrl = decodeHtmlEntities(match[1] ?? "");
    const title = stripHtml(match[2] ?? "");

    if (!rawUrl || !title) {
      continue;
    }

    const redirectMatch = rawUrl.match(/[?&]uddg=([^&]+)/);
    const normalizedUrl = redirectMatch
      ? decodeURIComponent(redirectMatch[1])
      : rawUrl;

    if (!normalizedUrl.startsWith("http")) {
      continue;
    }

    results.push({
      ...query,
      url: normalizedUrl,
      title,
      snippet: snippets[snippetIndex] ?? "",
    });
    snippetIndex += 1;
  }

  return results;
}

function extractPageTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeWhitespace(match?.[1] ?? "");
}

function extractTicketLinks(html: string, pageUrl: string) {
  const ticketLinks = new Set<string>();
  const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = decodeHtmlEntities(match[1] ?? "");
    const label = stripHtml(match[2] ?? "").toLowerCase();

    if (!href) {
      continue;
    }

    if (!/ticket|register|book|rsvp|passes|signup/.test(label + href)) {
      continue;
    }

    try {
      const resolvedUrl = new URL(href, pageUrl).toString();
      ticketLinks.add(resolvedUrl);
    } catch {
      continue;
    }
  }

  return [...ticketLinks].slice(0, 5);
}

function extractPageText(html: string) {
  return stripHtml(html).slice(0, 12000);
}

function normalizeUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hash = "";
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

function isLikelyAssetUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|svg|webp|pdf|css|js|xml)(\?|$)/i.test(url);
}

function looksLikeEventDetailUrl(url: string, sourceType: DiscoverySourceType) {
  const normalized = url.toLowerCase();

  if (sourceType === "instagram") {
    return /instagram\.com\/p\//.test(normalized);
  }

  if (sourceType === "reddit") {
    return /reddit\.com\/r\/[^/]+\/comments\//.test(normalized);
  }

  if (sourceType === "meetup") {
    return /meetup\.com\/[^/]+\/events\//.test(normalized);
  }

  if (sourceType === "event_website") {
    return (
      /allevents\.in\/bangalore\/[^/?#]+/.test(normalized) ||
      /bookmyshow\.com\/[^?#]*\/events\//.test(normalized)
    );
  }

  if (sourceType === "community_forum") {
    return (
      /insider\.in\/[^?#]*event/.test(normalized) ||
      /townscript\.com\/e\//.test(normalized)
    );
  }

  return /event|meetup|workshop|hackathon|conference|festival|fest|run|trek/i.test(
    normalized,
  );
}

function scoreAnchorLabel(label: string) {
  const normalized = label.toLowerCase();
  let score = 0;

  if (/bangalore|bengaluru/.test(normalized)) score += 3;
  if (/event|meetup|workshop|conference|concert|music|run|trek|fest/.test(normalized)) {
    score += 6;
  }
  if (/register|book|rsvp|ticket/.test(normalized)) score += 4;
  if (label.length > 12) score += 2;
  if (label.length > 28) score += 2;

  return score;
}

function extractEventDetailLinks(
  html: string,
  candidate: CandidateUrl,
  maxLinksPerPage = 6,
) {
  const detailLinks = new Map<string, CandidateUrl>();
  const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = decodeHtmlEntities(match[1] ?? "");
    const label = stripHtml(match[2] ?? "");

    if (!href || !label || isLikelyAssetUrl(href)) {
      continue;
    }

    try {
      const resolvedUrl = normalizeUrl(new URL(href, candidate.url).toString());

      if (!resolvedUrl.startsWith("http")) {
        continue;
      }

      if (!looksLikeEventDetailUrl(resolvedUrl, candidate.sourceType)) {
        continue;
      }

      const score = scoreAnchorLabel(label) + (resolvedUrl.includes("bangalore") ? 2 : 0);
      if (score < 6) {
        continue;
      }

      if (!detailLinks.has(resolvedUrl)) {
        detailLinks.set(resolvedUrl, {
          ...candidate,
          url: resolvedUrl,
          title: label.slice(0, 160),
          snippet: candidate.snippet,
        } as CandidateUrl);
      }
    } catch {
      continue;
    }
  }

  return [...detailLinks.values()].slice(0, maxLinksPerPage);
}

async function fetchHtmlPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BangaloreEventRadarBot/1.0; +https://example.com)",
    },
    next: { revalidate: 0 },
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    return null;
  }

  const html = await response.text();
  const content = extractPageText(html);

  if (!content || content.length < 400) {
    return null;
  }

  return {
    html,
    content,
    pageTitle: extractPageTitle(html),
    ticketLinks: extractTicketLinks(html, url),
  };
}

export function buildDiscoveryQueries() {
  return SEARCH_KEYWORDS.flatMap((keyword) =>
    SEARCH_SCOPES.map((scope) => ({
      query: `${keyword} ${scope.querySuffix}`,
      sourceType: scope.sourceType,
    })),
  );
}

export async function searchCandidateUrls(resultLimit = 2) {
  const queries = buildDiscoveryQueries();
  const candidates = new Map<string, CandidateUrl>();

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query.query)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; BangaloreEventRadarBot/1.0; +https://example.com)",
          },
          next: { revalidate: 0 },
        },
      );

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const results = parseDuckDuckGoResults(html, query).slice(0, resultLimit);

      for (const result of results) {
        if (!candidates.has(result.url)) {
          candidates.set(result.url, result);
        }
      }
    } catch {
      continue;
    }
  }

  for (const seed of SOURCE_SEEDS) {
    if (!candidates.has(seed.url)) {
      candidates.set(seed.url, seed);
    }
  }

  return {
    queries,
    candidates: [...candidates.values()],
  };
}

export async function fetchCandidatePages(
  candidates: CandidateUrl[],
  maxPages = 18,
) {
  const listingCandidates = candidates.slice(0, maxPages);
  const detailCandidates = new Map<string, CandidateUrl>();

  for (const candidate of listingCandidates) {
    try {
      const page = await fetchHtmlPage(candidate.url);

      if (!page) {
        continue;
      }

      if (looksLikeEventDetailUrl(candidate.url, candidate.sourceType)) {
        detailCandidates.set(candidate.url, {
          ...candidate,
          title: page.pageTitle || candidate.title,
          snippet: candidate.snippet,
        });
        continue;
      }

      const links = extractEventDetailLinks(page.html, candidate);
      for (const link of links) {
        if (!detailCandidates.has(link.url)) {
          detailCandidates.set(link.url, link);
        }
      }
    } catch {
      continue;
    }
  }

  const pages: FetchedPageCandidate[] = [];
  for (const candidate of [...detailCandidates.values()].slice(0, maxPages * 2)) {
    try {
      const page = await fetchHtmlPage(candidate.url);

      if (!page) {
        continue;
      }

      pages.push({
        ...candidate,
        pageTitle: page.pageTitle || candidate.title,
        content: page.content,
        rawHtml: page.html,
        ticketLinks: page.ticketLinks,
      });
    } catch {
      continue;
    }
  }

  return pages;
}
