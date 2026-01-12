import { NextResponse } from "next/server";
import { supabase, ArticleRow } from "@/lib/supabase";
import { ProcessedArticle } from "@/types/article";

// ISR: 1분마다 재검증 (DB에서 읽기만 하므로 빠름)
export const revalidate = 60;

export async function GET() {
  try {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .order("pub_date", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Transform DB rows to ProcessedArticle format
    const processedArticles: ProcessedArticle[] = (articles || []).map(
      (row: ArticleRow) => ({
        id: row.id,
        originalTitle: row.original_title,
        titleKo: row.title_ko,
        link: row.link,
        pubDate: row.pub_date,
        source: row.source,
        summary: row.summary,
        imageUrl: row.image_url || undefined,
      })
    );

    return NextResponse.json({
      articles: processedArticles,
      meta: {
        total: processedArticles.length,
        processed: processedArticles.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in feeds API:", error);
    return NextResponse.json(
      { error: "Failed to fetch feeds" },
      { status: 500 }
    );
  }
}
