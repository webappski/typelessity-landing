export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  ogImage?: string;
  body: string;
}

/** One post as a list shows it: no body. The source is blog-index.generated.ts (tools/build-blog-index.ts). */
export interface BlogIndexEntry {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
}
