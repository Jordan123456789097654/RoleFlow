import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    // 1. Resolve Roblox username to User ID
    const resolveRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
    });

    if (!resolveRes.ok) {
      return NextResponse.json({ error: "Roblox API error" }, { status: 502 });
    }

    const resolveData = await resolveRes.json();
    const userMatch = resolveData.data?.[0];

    if (!userMatch) {
      return NextResponse.json({ error: "Roblox user not found" }, { status: 404 });
    }

    const userId = userMatch.id;
    const name = userMatch.name;
    const displayName = userMatch.displayName;

    // 2. Fetch Avatar Headshot Thumbnail
    let avatarUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150";
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data?.[0]?.imageUrl) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }
    } catch (e) {
      console.warn("Error fetching Roblox thumbnail:", e);
    }

    // 3. Fetch User profile details (Created date / account age)
    let created = null;
    try {
      const userDetailsRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      if (userDetailsRes.ok) {
        const details = await userDetailsRes.json();
        created = details.created;
      }
    } catch (e) {}

    return NextResponse.json({
      id: userId,
      name,
      displayName,
      avatarUrl,
      created,
      profileUrl: `https://www.roblox.com/users/${userId}/profile`,
      devForumUrl: `https://devforum.roblox.com/u/${name}/summary`,
    });
  } catch (err) {
    console.error("Roblox API fetch error:", err);
    return NextResponse.json({ error: "Failed to communicate with Roblox" }, { status: 500 });
  }
}
