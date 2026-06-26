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
  status?: "Draft" | "Processing" | "Published" | "Archived"; // published/draft/processing/archived status
  published?: boolean;
  featured?: boolean;
  views: number;
  isLive?: boolean; // Live video badge
  isScheduled?: boolean; // Scheduled video option
  scheduledTime?: string; // Scheduled date/time string
  storageVerifiedAt?: string;
  storageStatus?: string;
  playbackStatus?: string;
  brokenWarning?: string;
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

export interface EBook {
  id: string;
  title: string;
  author: string;
  description: string;
  pdfUrl: string; // Base64 content or external URL or reference
  coverUrl?: string; // Optional cover image URL or Base64
  fileSize: string;
  publishDate: string; // ISO string
  downloadCount: number;
  allowDownload: boolean;
}

export interface AdCampaign {
  id: string;
  name: string;
  advertiserName: string;
  budget?: number;
  status: "Active" | "Paused" | "Ended";
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Ad {
  id: string;
  title: string;
  description?: string;
  advertiserName: string;
  destinationUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  adType: "Banner" | "Video" | "Popup" | "Sticky" | "Native";
  adPlacement:
    | "Top Banner"
    | "Header Banner"
    | "Footer Banner"
    | "Sidebar Banner"
    | "In-Article Banner"
    | "Homepage Banner"
    | "Pre-roll Ads"
    | "Mid-roll Ads"
    | "Post-roll Ads"
    | "Popup Ads"
    | "Sticky Ads"
    | "Native Ads";
  startDate: string;
  endDate: string;
  status: "Active" | "Paused" | "Scheduled" | "Ended";
  deviceTargeting: ("Mobile" | "Desktop" | "Tablet")[];
  categoryTargeting: string[];
  countries: string[];
  languages: string[];
  campaignId?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdPosition {
  id: string;
  name: string;
  enabled: boolean;
  provider: "custom" | "adsense";
  adsenseCode?: string;
  lazyLoad: boolean;
  createdAt: string;
}

export interface AdClick {
  id: string;
  adId: string;
  campaignId?: string;
  timestamp: string;
  country?: string;
  language?: string;
  device?: string;
  userAgent?: string;
  ip?: string;
}

export interface AdImpression {
  id: string;
  adId: string;
  campaignId?: string;
  timestamp: string;
  country?: string;
  language?: string;
  device?: string;
  userAgent?: string;
  ip?: string;
}

export interface VideoAd {
  id: string;
  title: string;
  description?: string;
  advertiserName: string;
  videoUrl: string;
  thumbnailUrl?: string;
  destinationUrl: string;
  placement: "Pre-roll" | "Mid-roll" | "Post-roll" | "Homepage Banner" | "In-Article" | "Sticky" | "Fullscreen";
  enabled: boolean;
  priority: number; // 1-5
  frequencyCap: number; // Max views per session/user
  startDate: string;
  endDate: string;
  deviceTargeting: ("Mobile" | "Desktop" | "Tablet")[];
  categoryTargeting: string[];
  countryTargeting: string;
  languageTargeting: string;
  campaignId?: string;
  duration: number; // seconds
  impressions: number;
  clicks: number;
  completions: number;
  totalWatchTime: number; // in seconds
  createdAt: string;
  updatedAt?: string;
}

export interface VideoAdCampaign {
  id: string;
  name: string;
  advertiser: string;
  budget: number;
  startDate: string;
  endDate: string;
  enabled: boolean;
  createdAt: string;
}

export interface VideoAdView {
  id: string;
  adId: string;
  campaignId?: string;
  timestamp: string;
  watchTime: number;
  completed: boolean;
  device: "Mobile" | "Desktop" | "Tablet";
  country: string;
  language: string;
}

export interface VideoAdClick {
  id: string;
  adId: string;
  campaignId?: string;
  timestamp: string;
  device: "Mobile" | "Desktop" | "Tablet";
  country: string;
  language: string;
}

export interface VideoAdSettings {
  id: string;
  autoplayBehavior: "muted" | "allowed";
  lazyLoad: boolean;
  frequencyCheckEnabled: boolean;
  optimizedCompression: boolean;
  updatedAt: string;
}
