import { NextRequest, NextResponse } from "next/server";
import { getSoundEngine } from "@/lib/sound-engine/server-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json([]);

  try {
    const engine = await getSoundEngine();
    const response = await engine.getSearchSuggestions(query);
    const suggestions = Array.isArray(response)
      ? response
      : Array.isArray((response as { suggestions?: unknown[] })?.suggestions)
        ? (response as { suggestions: unknown[] }).suggestions
        : [];
    return NextResponse.json(
      suggestions.filter((suggestion): suggestion is string => typeof suggestion === "string").slice(0, 8),
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Suggestion request failed:", error);
    return NextResponse.json([], { status: 502 });
  }
}