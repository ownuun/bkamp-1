import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { processArticle } from "@/lib/groq";
import { supabase, ArticleRow } from "@/lib/supabase";

const MAX_ARTICLES = 200;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch raw RSS feeds
    const rawArticles = await fetchAllFeeds();

    // 2. Get existing links from DB
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("link");

    const existingLinks = new Set(existingArticles?.map((a) => a.link) || []);

    // 3. Filter new articles only
    const newArticles = rawArticles.filter((a) => !existingLinks.has(a.link));

    if (newArticles.length === 0) {
      return NextResponse.json({
        message: "No new articles",
        processed: 0,
      });
    }

    // 4. Process new articles with AI (limit to 10 per run)
    const toProcess = newArticles.slice(0, 10);
    const processed: ArticleRow[] = [];

    for (const article of toProcess) {
      const result = await processArticle(article);
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

    // 5. Insert new articles
    const { error: insertError } = await supabase
      .from("articles")
      .upsert(processed, { onConflict: "link" });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // 6. Keep only latest MAX_ARTICLES
    const { data: allArticles } = await supabase
      .from("articles")
      .select("id, pub_date")
      .order("pub_date", { ascending: false });

    if (allArticles && allArticles.length > MAX_ARTICLES) {
      const toDelete = allArticles.slice(MAX_ARTICLES).map((a) => a.id);
      await supabase.from("articles").delete().in("id", toDelete);
    }

    return NextResponse.json({
      message: "Cron completed",
      processed: processed.length,
      total: allArticles?.length || 0,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
