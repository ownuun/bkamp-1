"use client";

import { ProcessedArticle } from "@/types/article";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    TechCrunch: "badge-success",
    "The Verge": "badge-info",
    "Hacker News": "badge-warning",
    Wired: "badge-error",
    "Ars Technica": "badge-secondary",
  };
  return colors[source] || "badge-neutral";
}

interface ArticleCardProps {
  article: ProcessedArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
      {article.imageUrl && (
        <figure className="relative h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.titleKo}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </figure>
      )}
      <div className="card-body">
        <div className="flex items-center gap-2 mb-2">
          <span className={`badge ${getSourceColor(article.source)} badge-sm`}>
            {article.source}
          </span>
          <span className="text-xs text-base-content/60">
            {formatRelativeTime(article.pubDate)}
          </span>
        </div>

        <h2 className="card-title text-lg">{article.titleKo}</h2>

        {article.originalTitle !== article.titleKo && (
          <p className="text-sm text-base-content/50 italic">
            {article.originalTitle}
          </p>
        )}

        <ul className="mt-3 space-y-1">
          {article.summary.map((point, index) => (
            <li key={index} className="flex gap-2 text-sm">
              <span className="text-primary">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="card-actions justify-end mt-4">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            원문 보기 →
          </a>
        </div>
      </div>
    </div>
  );
}
