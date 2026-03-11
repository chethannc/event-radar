import { NextRequest, NextResponse } from "next/server";

import { getEvents, getRecommendedEvents } from "@/lib/server-events";

export async function POST(request: NextRequest) {
  const { query } = (await request.json()) as {
    query?: string;
  };

  if (!query?.trim()) {
    return NextResponse.json(
      { error: "A recommendation query is required." },
      { status: 400 },
    );
  }

  const events = await getEvents();
  const recommendation = await getRecommendedEvents(query, events);

  return NextResponse.json(recommendation);
}
