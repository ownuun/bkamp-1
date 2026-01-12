import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { processArticle } from "@/lib/groq";
import { supabase, ArticleRow } from "@/lib/supabase";

const MAX_ARTICLES = 200;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  console.log("[CRON] === Cron job started ===");
  console.log("[CRON] Environment check:", {
    hasCronSecret: !!process.env.CRON_SECRET,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
  });

  // Verify cron secret (optional security)
  const authHeader = request.headers.get("authorization");
  console.log("[CRON] Auth header present:", !!authHeader);

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log("[CRON] Authorization failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch raw RSS feeds
    console.log("[CRON] Fetching RSS feeds...");
    const rawArticles = await fetchAllFeeds();
    console.log("[CRON] RSS fetched:", rawArticles.length, "articles");

    // 2. Get existing links from DB
    console.log("[CRON] Querying existing articles from DB...");
    const { data: existingArticles, error: selectError } = await supabase
      .from("articles")
      .select("link");

    if (selectError) {
      console.error("[CRON] DB select error:", selectError);
      throw selectError;
    }

    const existingLinks = new Set(existingArticles?.map((a) => a.link) || []);
    console.log("[CRON] Existing articles in DB:", existingLinks.size);

    // 3. Filter new articles only
    const newArticles = rawArticles.filter((a) => !existingLinks.has(a.link));
    console.log("[CRON] New articles to process:", newArticles.length);

    if (newArticles.length === 0) {
      console.log("[CRON] No new articles found, exiting");
      return NextResponse.json({
        message: "No new articles",
        processed: 0,
      });
    }

    // 4. Process new articles with AI (limit to 10 per run)
    const toProcess = newArticles.slice(0, 10);
    const processed: ArticleRow[] = [];
    console.log("[CRON] Processing", toProcess.length, "articles with AI...");

    for (const article of toProcess) {
      const result = await processArticle(article);
      console.log("[CRON] Processed:", result.titleKo?.substring(0, 50) || result.originalTitle.substring(0, 50));
      processed.push({
        id: result.id,
        original_title: result.originalTitle,
        title_ko: result.titleKo,
        link: result.link,
        pub_date: result.pubDate,
        source: result.source,
        summary: result.summary,
        image_url: result.imageUrl || null,
        created_at: new Date().toISOString(),
      });
    }
    console.log("[CRON] AI processing complete:", processed.length, "articles");

    // 5. Insert new articles
    console.log("[CRON] Inserting articles to DB...");
    const { error: insertError } = await supabase
      .from("articles")
      .upsert(processed, { onConflict: "link" });

    if (insertError) {
      console.error("[CRON] DB insert error:", insertError);
      throw insertError;
    }
    console.log("[CRON] Articles inserted successfully");

    // 6. Keep only latest MAX_ARTICLES
    console.log("[CRON] Checking article count for cleanup...");
    const { data: allArticles } = await supabase
      .from("articles")
      .select("id, pub_date")
      .order("pub_date", { ascending: false });

    if (allArticles && allArticles.length > MAX_ARTICLES) {
      const toDelete = allArticles.slice(MAX_ARTICLES).map((a) => a.id);
      console.log("[CRON] Deleting", toDelete.length, "old articles");
      await supabase.from("articles").delete().in("id", toDelete);
    }

    console.log("[CRON] === Cron job completed ===");
    console.log("[CRON] Total articles in DB:", allArticles?.length || 0);

    return NextResponse.json({
      message: "Cron completed",
      processed: processed.length,
      total: allArticles?.length || 0,
    });
  } catch (error) {
    console.error("[CRON] Error:", error);
    return NextResponse.json(
      { error: "Cron failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
