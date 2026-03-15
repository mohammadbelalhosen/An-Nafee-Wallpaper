export interface Wallpaper {
  id: string;
  imageUrl: string;
  type: 'mobile' | 'desktop' | 'fb_profile' | 'fb_cover';
  category?: string;
  creditUrl?: string;
  createdAt: any;
  authorId: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  likes: number;
  authorId: string;
}

export interface SiteConfig {
  heroHeading: string;
  heroSubHeading: string;
  wallpaperRequestUrl?: string;
}

export interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: any;
}

export interface AppItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  createdAt: any;
}

export interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  embedDisabled?: boolean;
  createdAt: any;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  playlistUrl: string;
  createdAt: any;
}

export interface FloatingContent {
  title: string;
  description: string;
  reference: string;
}
