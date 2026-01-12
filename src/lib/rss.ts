import Parser from "rss-parser";
import { RawArticle, FeedSource } from "@/types/article";

type CustomItem = {
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  "content:encoded"?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
    ],
  },
});

function extractImageUrl(item: CustomItem & Parser.Item): string | undefined {
  // 1. enclosure (podcast/media attachments)
  if (item.enclosure?.url && item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
    return item.enclosure.url;
  }

  // 2. media:content
  if (item["media:content"]?.$?.url) {
    return item["media:content"].$.url;
  }

  // 3. media:thumbnail
  if (item["media:thumbnail"]?.$?.url) {
    return item["media:thumbnail"].$.url;
  }

  // 4. Extract from content HTML
  const content = item.content || item["content:encoded"] || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    return imgMatch[1];
  }

  return undefined;
}

export const FEED_SOURCES: FeedSource[] = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "startups" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", category: "dev" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", category: "tech" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/technology-lab", category: "tech" },
  { name: "Techmeme", url: "https://www.techmeme.com/feed.xml", category: "tech" },
];

export async function fetchFeed(source: FeedSource): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.slice(0, 15).map((item) => ({
      title: item.title || "No title",
      link: item.link || "",
      pubDate: item.pubDate || new Date().toISOString(),
      content: item.content,
      contentSnippet: item.contentSnippet,
      source: source.name,
      imageUrl: extractImageUrl(item),
    }));
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error);
    return [];
  }
}

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  );

  const articles: RawArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  // Sort by date (newest first)
  return articles.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
