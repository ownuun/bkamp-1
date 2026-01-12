"use client";

export type Category = "all" | "startups" | "tech" | "dev";

interface CategoryTabsProps {
  selected: Category;
  onChange: (category: Category) => void;
}

const TABS: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "startups", label: "Startups" },
  { id: "tech", label: "Tech" },
  { id: "dev", label: "Dev" },
];

export function CategoryTabs({ selected, onChange }: CategoryTabsProps) {
  return (
    <div className="flex justify-center mb-6">
      <div role="tablist" className="tabs tabs-boxed">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            className={`tab ${selected === tab.id ? "tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 소스 이름을 카테고리로 매핑
export function getSourceCategory(source: string): Category {
  switch (source) {
    case "TechCrunch":
      return "startups";
    case "Hacker News":
      return "dev";
    default:
      return "tech";
  }
}
