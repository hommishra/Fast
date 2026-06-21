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
  imageAlt?: string;
  imageCaption?: string;
  photographerCredit?: string;
  imageDimensions?: string;
  imageFileSize?: string;
  imageMime?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  approvalNotes?: string;
  approvingEditor?: string;
  imageHistory?: Array<{ url: string; timestamp: string }>;
  isLazyLoaded?: boolean;
  compressionQuality?: "Low" | "Medium" | "High";
  cdnOptimized?: boolean;
  imageGallery?: string[];
  images?: string[];
  imageCaptions?: string[];
  featuredImage400?: string;
  featuredImage85?: string;
  featuredImage800?: string;
  featuredImageBackup?: string;
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
  securityEmail?: string; // Customizable security ops email
  aboutText: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialYoutube: string;
  seoDescription: string;
  adSenseCode: string; // Simulation
  analyticsCode: string; // Simulation
  mobileNumbers?: string[]; // Admin managed mobile contacts
  gmailIds?: string[]; // Admin managed gmail contacts
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

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  url: string; // fallback or streaming url
  videoUrl?: string; // permanent storage streaming video URL
  thumbnailUrl?: string; // permanent generated thumbnail image URL
  category?: string; // category classification
  duration?: string; // parsed or custom duration
  createdAt: string; // ISO format
  updatedAt?: string; // ISO format
  publishedAt?: string; // published timestamp
  author?: string; // publisher author email or name
  status?: "Draft" | "Published"; // published/draft status
  published?: boolean;
  featured?: boolean;
  views: number;
  isLive?: boolean; // Live video badge
  isScheduled?: boolean; // Scheduled video option
  scheduledTime?: string; // Scheduled date/time string
}

export interface CoverageZone {
  id: string;
  name: string;
  x: number; // Percent width (0 to 100) on SVG world map
  y: number; // Percent height (0 to 100) on SVG world map
  status: "active" | "alert" | "offline";
  reporterName?: string;
  details?: string;
  createdAt: string;
}

export interface Bookmark {
  id: string; // userId_articleId
  userId: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  featuredImage: string;
  categoryId: string;
  savedAt: string;
}



