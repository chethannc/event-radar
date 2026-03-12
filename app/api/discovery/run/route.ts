import { NextRequest, NextResponse } from "next/server";

import { runHiddenEventDiscovery } from "@/lib/discovery/run-hidden-discovery";

function isAuthorized(request: NextRequest) {
  const configuredSecret =
    process.env.DISCOVERY_CRON_TOKEN ?? process.env.CRON_SECRET;

  if (!configuredSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");
  const queryToken = request.nextUrl.searchParams.get("token");

  return bearerToken === configuredSecret || queryToken === configuredSecret;
}

async function handleDiscovery(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runHiddenEventDiscovery();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Hidden discovery route failed", error);

    return NextResponse.json(
      {
        error: "Hidden discovery failed.",
        detail:
          error instanceof Error ? error.message : "Unknown discovery error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleDiscovery(request);
}

export async function POST(request: NextRequest) {
  return handleDiscovery(request);
}
