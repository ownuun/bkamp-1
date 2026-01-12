"use client";

import { useEffect, useState, useMemo } from "react";
import { ProcessedArticle } from "@/types/article";
import { ArticleCard } from "./article-card";
import { Category, getSourceCategory } from "./category-tabs";

interface FeedResponse {
  articles: ProcessedArticle[];
  meta: {
    total: number;
    processed: number;
    timestamp: string;
  };
}

interface FeedListProps {
  selectedCategory?: Category;
}

export function FeedList({ selectedCategory = "all" }: FeedListProps) {
  const [articles, setArticles] = useState<ProcessedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeeds() {
      try {
        setLoading(true);
        const res = await fetch("/api/feeds");
        if (!res.ok) throw new Error("Failed to fetch feeds");

        const data: FeedResponse = await res.json();
        setArticles(data.articles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchFeeds();
  }, []);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "all") return articles;
    return articles.filter(
      (article) => getSourceCategory(article.source) === selectedCategory
    );
  }, [articles, selectedCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60">기사를 불러오는 중...</p>
        <p className="text-xs text-base-content/40">
          AI가 번역 및 요약 중입니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-md mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-base-content/60">기사가 없습니다.</p>
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-base-content/60">
          선택한 카테고리에 해당하는 기사가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredArticles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
