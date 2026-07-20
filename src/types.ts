export type UserRole = 'Super Admin' | 'Admin' | 'Editor' | 'Journalist' | 'Moderator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'Active' | 'Inactive';
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  summary: string;
  category: string;
  subcategory?: string;
  image: string;
  videoUrl?: string;
  author: string;
  authorRole: UserRole;
  publishDate: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  isPinned: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  commentsCount: number;
  keywords: string[];
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  date: string;
  isApproved: boolean;
}

export interface AdSlot {
  id: string;
  type: 'Header' | 'Sidebar' | 'Footer' | 'Sticky' | 'Mobile' | 'In-Article' | 'Popup';
  label: string;
  code?: string;
  imageUrl?: string;
  targetUrl?: string;
  active: boolean;
}

export interface WebsiteSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  footerText: string;
  primaryColor: string; // 'red', 'blue', 'emerald', 'zinc'
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  rssEnabled: boolean;
  twoFactorEnabled: boolean;
}

export interface CareerListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string; // Full-time, Part-time, Internship
  description: string;
  requirements: string[];
}

export interface BreakingNewsItem {
  id: string;
  title: string;
  isPinned: boolean;
  publishDate: string;
  category?: string;
  active: boolean;
}

export interface MarketItem {
  id: string;
  name: string;
  value: string;
  change: string;
  isUp: boolean;
  active: boolean;
  position: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  publishDate: string;
  category: string;
  author: string;
}


