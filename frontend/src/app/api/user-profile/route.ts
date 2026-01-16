import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }
  return neon(process.env.DATABASE_URL);
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const sql = getDb();
    const items = await sql`
      SELECT id, item_type, value, metadata, confirmed, created_at
      FROM user_profile_items
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemType, value, metadata = {}, confirmed = false } = body;

    if (!userId || !itemType || !value) {
      return NextResponse.json(
        { error: "userId, itemType, and value required" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Upsert - insert or update if exists
    const result = await sql`
      INSERT INTO user_profile_items (user_id, item_type, value, metadata, confirmed)
      VALUES (${userId}, ${itemType}, ${value}, ${JSON.stringify(metadata)}, ${confirmed})
      ON CONFLICT (user_id, item_type, value)
      DO UPDATE SET
        metadata = ${JSON.stringify(metadata)},
        confirmed = ${confirmed},
        updated_at = NOW()
      RETURNING id, item_type, value, metadata, confirmed
    `;

    // Also store to Zep for AI memory (fire and forget)
    storeToZep(userId, itemType, value, metadata).catch((e) =>
      console.warn("Zep store failed:", e)
    );

    return NextResponse.json({ success: true, item: result[0] });
  } catch (error) {
    console.error("Error saving profile item:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const itemId = request.nextUrl.searchParams.get("itemId") || request.nextUrl.searchParams.get("id");

  if (!userId || !itemId) {
    return NextResponse.json({ error: "userId and itemId required" }, { status: 400 });
  }

  try {
    const sql = getDb();
    await sql`
      DELETE FROM user_profile_items
      WHERE id = ${parseInt(itemId)} AND user_id = ${userId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting profile item:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// Store preference to Zep for AI memory
async function storeToZep(
  userId: string,
  itemType: string,
  value: string,
  metadata: Record<string, unknown>
) {
  const ZEP_API_KEY = process.env.ZEP_API_KEY;
  if (!ZEP_API_KEY) return;

  // Construct a natural language fact for Zep (wine-specific)
  let factText = "";
  if (itemType === "favorite_region") {
    factText = `User's favorite wine region is ${value}`;
  } else if (itemType === "favorite_grape") {
    factText = `User prefers ${value} wines`;
  } else if (itemType === "budget") {
    factText = `User's wine budget is ${value}`;
  } else if (itemType === "occasion") {
    factText = `User often buys wine for ${value}`;
  } else if (itemType === "preference") {
    factText = `User preference: ${value}`;
  } else {
    factText = `User wine preference: ${itemType} = ${value}`;
  }

  // Ensure user exists in Zep
  await fetch("https://api.getzep.com/api/v2/users", {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${ZEP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  // Add fact via memory endpoint
  await fetch(`https://api.getzep.com/api/v2/users/${userId}/memory`, {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${ZEP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: factText,
        },
      ],
    }),
  });
}
