export interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  source: string;
  imageUrl?: string;
}

export interface ProcessedArticle {
  id: string;
  originalTitle: string;
  titleKo: string;
  link: string;
  pubDate: string;
  source: string;
  summary: string[];
  imageUrl?: string;
  isProcessing?: boolean;
  error?: string;
}

export interface FeedSource {
  name: string;
  url: string;
  category: string;
}
