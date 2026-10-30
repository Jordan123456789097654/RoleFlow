import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionValue } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSiteAdminUser } from "@/lib/roles";
import { getDynamicProducts, getDynamicCountdown, getDynamicBlogPosts } from "@/lib/parent-site";
import { sendBlogPostEmailBlast } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSiteAdmin: true, siteRole: true },
  });
  if (!user || !isSiteAdminUser(user)) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, countdown, blogPosts] = await Promise.all([
    getDynamicProducts(),
    getDynamicCountdown(),
    getDynamicBlogPosts(),
  ]);

  return NextResponse.json({
    products,
    countdown,
    blogPosts,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  // 1. Save or edit products
  if (action === "save_products") {
    const { products } = body;
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Products must be an array." }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: "parent_products" },
      update: { value: JSON.stringify(products) },
      create: { key: "parent_products", value: JSON.stringify(products) },
    });

    return NextResponse.json({ success: true, message: "Products updated successfully." });
  }

  if (action === "reset_products") {
    await prisma.systemSetting.deleteMany({
      where: { key: "parent_products" },
    });
    return NextResponse.json({ success: true, message: "Products reset to default lineup." });
  }

  // 2. Countdown banner
  if (action === "save_countdown") {
    const { targetDate, label } = body;
    await prisma.systemSetting.upsert({
      where: { key: "parent_countdown" },
      update: { value: JSON.stringify({ targetDate: targetDate || null, label: label || null }) },
      create: { key: "parent_countdown", value: JSON.stringify({ targetDate: targetDate || null, label: label || null }) },
    });

    return NextResponse.json({ success: true, message: "Countdown updated successfully." });
  }

  // 3. Create or Edit Blog Post
  if (action === "save_blog_post") {
    const { slug, title, excerpt, content, author, readTime, date, sendEmail } = body;
    if (!slug || !title || !content) {
      return NextResponse.json({ error: "Slug, title, and content are required." }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-");
    const contentArray = Array.isArray(content)
      ? content
      : String(content).split("\n\n").filter(Boolean);

    await prisma.parentBlogPost.upsert({
      where: { slug: cleanSlug },
      update: {
        title,
        excerpt: excerpt || contentArray[0]?.slice(0, 160) || "",
        content: JSON.stringify(contentArray),
        author: author || "RoleFlow Team",
        readTime: readTime || "3 min read",
        date: date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      },
      create: {
        slug: cleanSlug,
        title,
        excerpt: excerpt || contentArray[0]?.slice(0, 160) || "",
        content: JSON.stringify(contentArray),
        author: author || "RoleFlow Team",
        readTime: readTime || "3 min read",
        date: date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      },
    });

    let emailStats = null;
    if (sendEmail) {
      try {
        emailStats = await sendBlogPostEmailBlast({
          slug: cleanSlug,
          title,
          excerpt: excerpt || contentArray[0]?.slice(0, 160) || "",
          author: author || "RoleFlow Team",
          content: contentArray,
        });
      } catch (err) {
        console.error("Failed to blast blog post email:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailStats && emailStats.sent > 0
        ? `Blog post published & emailed to ${emailStats.sent} subscribers!`
        : "Blog post published successfully!",
      emailStats,
    });
  }

  // 3b. Send email blast for an already existing post
  if (action === "send_blog_email") {
    const { slug } = body;
    if (!slug) return NextResponse.json({ error: "Missing post slug." }, { status: 400 });

    const post = await prisma.parentBlogPost.findUnique({ where: { slug } });
    if (!post) return NextResponse.json({ error: "Blog post not found." }, { status: 404 });

    const contentArray = typeof post.content === "string" ? JSON.parse(post.content) : post.content;
    const emailStats = await sendBlogPostEmailBlast({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      author: post.author,
      content: contentArray,
    });

    return NextResponse.json({
      success: true,
      message: `Email broadcast dispatched to ${emailStats.sent} of ${emailStats.eligible} subscribers!`,
      emailStats,
    });
  }

  // 4. Delete Blog Post
  if (action === "delete_blog_post") {
    const { slug } = body;
    if (!slug) return NextResponse.json({ error: "Missing post slug." }, { status: 400 });

    await prisma.parentBlogPost.deleteMany({ where: { slug } });
    return NextResponse.json({ success: true, message: "Blog post removed." });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
