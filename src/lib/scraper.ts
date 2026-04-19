/**
 * IndyCar Live Timing Scraper
 *
 * Attempts to fetch live race positions from IndyCar's timing data.
 * IndyCar provides a live timing feed during races, but the endpoints
 * and data format can change year to year.
 *
 * Known approaches:
 * 1. IndyCar's live timing page uses WebSocket connections to
 *    racecontrol.indycar.com for real-time data
 * 2. The timing data endpoint has historically been at:
 *    https://timing.indycar.com/api/v1/results
 *    but this is not guaranteed to be stable or publicly documented
 * 3. During race day, data is available at various IndyCar API endpoints
 *
 * FALLBACK: If scraping fails, use the admin page (/pool/[code]/admin)
 * to manually enter race positions. This is the recommended approach
 * for reliability.
 */

export interface RacePosition {
  polePosition: number;
  currentPosition: number;
  driverName: string;
  carNumber: string;
}

/**
 * Attempt to fetch live race positions from IndyCar timing.
 * Returns null if the data cannot be fetched (use admin page as fallback).
 */
export async function fetchLivePositions(): Promise<RacePosition[] | null> {
  try {
    // Try the IndyCar timing API
    // Note: This endpoint may not be active outside of race events
    const response = await fetch(
      "https://timing.indycar.com/api/v1/results/race",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Indy500Pool/1.0",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.log("IndyCar timing API returned:", response.status);
      return null;
    }

    const data = await response.json();

    // The response format varies -- this is a best guess based on
    // publicly observed data structures. Adjust as needed for the
    // actual 2025/2026 race data format.
    if (Array.isArray(data)) {
      return data.map(
        (entry: {
          startPosition?: number;
          position?: number;
          driverName?: string;
          carNumber?: string;
        }) => ({
          polePosition: entry.startPosition ?? 0,
          currentPosition: entry.position ?? 0,
          driverName: entry.driverName ?? "Unknown",
          carNumber: entry.carNumber ?? "",
        })
      );
    }

    return null;
  } catch (error) {
    console.log("Failed to fetch live positions:", error);
    return null;
  }
}
