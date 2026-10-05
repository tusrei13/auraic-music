import { NextRequest, NextResponse } from "next/server";
import { getEngineCredentials } from "@/lib/sound-engine/server-engine";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathSegments = path || [];
  const joinedPath = pathSegments.join("/");

  if (!joinedPath) {
    return NextResponse.json({ error: "Missing sound engine endpoint path" }, { status: 400 });
  }

  const { clientId, baseUrl } = getEngineCredentials();

  try {
    const upstreamUrl = new URL(`${baseUrl}${joinedPath}/`);
    upstreamUrl.searchParams.set("format", "jsonpretty");
    upstreamUrl.searchParams.set("client_id", clientId);

    // Forward incoming query parameters
    const incomingParams = request.nextUrl.searchParams;
    incomingParams.forEach((value, key) => {
      if (key !== "client_id" && key !== "format") {
        upstreamUrl.searchParams.set(key, value);
      }
    });

    const response = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "AuraicSoundEngine/1.0",
      },
      next: { revalidate: 120 },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return NextResponse.json(
        { error: "Sound engine upstream error", status: response.status },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (err) {
    console.error(`[SoundEngine Proxy] Error forwarding request to /${joinedPath}:`, err);
    return NextResponse.json(
      { error: "Failed to connect to Sound Engine upstream" },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
    },
  });
}
