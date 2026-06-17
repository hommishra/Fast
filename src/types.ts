export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  status: "Draft" | "Published" | "Archived";
  categoryId: string;
  subCategoryId?: string;
  publishDate: string; // ISO format
  scheduleDate?: string;
  authorId: string;
  authorName: string;
  views: number;
  relatedArticles?: string[]; // IDs of related articles
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string; // Supports parent-child relationship
}

export interface Comment {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "Pending" | "Approved" | "Rejected" | "Spam";
  createdAt: string;
}

export interface UserDB {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Author";
  status: "Active" | "Suspended";
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
}

export interface BreakingNews {
  id: string;
  text: string;
  active: boolean;
  createdAt: string;
}

export interface WebSettings {
  logoText: string;
  siteTitle: string;
  contactEmail: string;
  aboutText: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialYoutube: string;
  seoDescription: string;
  adSenseCode: string; // Simulation
  analyticsCode: string; // Simulation
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "document";
  size: string;
  folder: string;
  createdAt: string;
}
