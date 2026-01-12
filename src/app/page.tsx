"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { FeedList } from "@/components/feed-list";
import { CategoryTabs, Category } from "@/components/category-tabs";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <p className="text-base-content/60">
            미국 테크 기사를 실시간 수집하여 한국어 번역 및 스타트업 관점 3줄 요약을 제공합니다
          </p>
        </div>
        <CategoryTabs
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
        <FeedList selectedCategory={selectedCategory} />
      </main>
      <footer className="footer footer-center p-4 bg-base-200 text-base-content mt-8">
        <p>
          TechCrunch, The Verge, Hacker News, Wired, Ars Technica, Techmeme에서 수집
        </p>
      </footer>
    </div>
  );
}
