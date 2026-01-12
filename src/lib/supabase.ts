import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ArticleRow {
  id: string;
  original_title: string;
  title_ko: string;
  link: string;
  pub_date: string;
  source: string;
  summary: string[];
  image_url: string | null;
  created_at: string;
}
