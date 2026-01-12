import Groq from "groq-sdk";
import { RawArticle, ProcessedArticle } from "@/types/article";

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

const SYSTEM_PROMPT = `당신은 스타트업 전문 테크 저널리스트입니다.
영문 기사를 한국어로 번역하고 스타트업 관점에서 3줄로 요약합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title_ko": "한국어 제목",
  "summary": [
    "1. 무슨 일이 일어났는가 (핵심 사건/발표)",
    "2. 왜 중요한가 (시장/산업 영향)",
    "3. 스타트업 시사점 (기회/위협/교훈)"
  ]
}`;

export async function processArticle(article: RawArticle): Promise<ProcessedArticle> {
  const id = Buffer.from(article.link).toString("base64url");
  const groq = getGroqClient();

  if (!groq) {
    return {
      id,
      originalTitle: article.title,
      titleKo: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      summary: ["GROQ_API_KEY가 설정되지 않았습니다."],
      imageUrl: article.imageUrl,
      error: "Missing API key",
    };
  }

  try {
    const content = article.contentSnippet || article.content || article.title;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `제목: ${article.title}\n\n내용: ${content.slice(0, 2000)}`
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("Empty response from Groq");

    const parsed = JSON.parse(response);

    return {
      id,
      originalTitle: article.title,
      titleKo: parsed.title_ko || article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      summary: parsed.summary || [],
      imageUrl: article.imageUrl,
    };
  } catch (error) {
    console.error(`Error processing article:`, error);
    return {
      id,
      originalTitle: article.title,
      titleKo: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      summary: ["처리 중 오류가 발생했습니다."],
      imageUrl: article.imageUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function processArticles(articles: RawArticle[]): Promise<ProcessedArticle[]> {
  // Process articles sequentially to avoid rate limits
  const processed: ProcessedArticle[] = [];

  for (const article of articles.slice(0, 10)) {
    const result = await processArticle(article);
    processed.push(result);
  }

  return processed;
}
