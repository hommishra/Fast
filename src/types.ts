export type UserRole = 'Website Owner' | 'Super Admin' | 'Admin' | 'Editor' | 'Journalist' | 'Moderator' | 'News Reporter';

export interface UserPermissions {
  fullWebsiteControl: boolean;
  partialWebsiteControl: boolean;
  articleManagement: boolean;
  advertisementManagement: boolean;
  videoManagement: boolean;
  breakingNewsManagement: boolean;
  seoManagement: boolean;
  userManagement: boolean;
  homepageManagement: boolean;
  socialMediaManagement: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  role: UserRole;
  designation?: string;
  avatar: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  permissions: UserPermissions;
  bio?: string;
  password?: string;
  lastActive?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentSectionId?: string;
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
  images?: string[]; // Multiple article images / gallery
  videoUrl?: string;
  author: string;
  authorRole?: UserRole;
  authorImage?: string; // Author profile image URL
  authorDesignation?: string; // Author designation / title
  authorBio?: string; // Author biography
  authorSocials?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    email?: string;
  };
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  publishDate: string;
  scheduledDate?: string;
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

export type AdSlotType = 
  | 'Header' 
  | 'Sidebar' 
  | 'Footer' 
  | 'Sticky' 
  | 'Mobile' 
  | 'In-Article' 
  | 'Between-Articles' 
  | 'Homepage' 
  | 'Breaking-News-Section' 
  | 'Video-Ad' 
  | 'Popup';

export type AdFormatType = 'Google AdSense' | 'Banner' | 'Native' | 'Custom HTML' | 'Video Ad' | 'Image Ad';

export interface AdSlot {
  id: string;
  type: AdSlotType;
  label: string;
  code?: string;
  imageUrl?: string;
  targetUrl?: string;
  active: boolean;
  paragraphPosition?: number; // Decides which paragraph to show inside (e.g. 1, 2, 3...)
  adSize?: string; // e.g. '728x90', '300x250', 'Fluid', 'Video'
  category?: string;
  adType?: AdFormatType;
}

export interface PhoneContact {
  id: string;
  label: string;
  number: string;
  active: boolean;
}

export interface EmailContact {
  id: string;
  label: string;
  email: string;
  active: boolean;
}

export interface OfficeAddressItem {
  id: string;
  label: string;
  title?: string;
  address: string;
  mapUrl?: string;
  googleMapsUrl?: string;
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
  telegramUrl?: string;
  linkedinUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  rssEnabled: boolean;
  twoFactorEnabled: boolean;
  contactPhone?: string;
  contactEmail?: string;
  officeAddress?: string;
  officeAddressNY?: string;
  officeAddressLondon?: string;
  officeAddressDelhi?: string;

  // Dynamic Contact Lists
  mobileNumbers?: PhoneContact[];
  whatsappNumbers?: PhoneContact[];
  emailAddresses?: EmailContact[];
  officeAddresses?: OfficeAddressItem[];
  googleMapsEmbedUrl?: string;
  googleMapsLocationUrl?: string;

  // Breaking News Ticker Speed Options
  tickerSpeed?: 'slow' | 'medium' | 'fast' | 'custom';
  tickerSpeedSeconds?: number; // Duration or scroll speed multiplier

  // Live Markets Options
  chartPosition?: 'Side' | 'Bottom' | 'Top';
  cryptoMarketEnabled?: boolean;
  forexMarketEnabled?: boolean;
  commoditiesEnabled?: boolean;
  usMarketsEnabled?: boolean;
  indiaMarketsEnabled?: boolean;
  ukMarketsEnabled?: boolean;
  japanMarketsEnabled?: boolean;
  chinaMarketsEnabled?: boolean;
  europeMarketsEnabled?: boolean;
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
  symbol?: string;
  category?: string;
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
  fileSize?: string; // Up to 10 GB support
  format?: 'MP4' | 'MOV' | 'AVI' | 'WEBM' | 'MKV';
  isLiveRecording?: boolean;
}

export interface LiveStreamSession {
  id: string;
  title: string;
  description: string;
  category: string;
  isLive: boolean;
  startedAt?: string;
  endedAt?: string;
  streamUrl?: string;
  recordedVideoUrl?: string;
  thumbnailUrl?: string;
  views: number;
  author: string;
  scheduledTime?: string;
}

export interface LiveBroadcastState {
  isLive: boolean;
  title: string;
  description: string;
  category: string;
  streamUrl: string;
  thumbnailUrl: string;
  scheduledTime?: string;
  viewerCount: number;
  startTime?: string;
  isPinned?: boolean;
  author?: string;
  streamType?: 'camera' | 'upload' | 'stream';
  enabled?: boolean;
}

export interface ParentSection {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}



