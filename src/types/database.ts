export type AppRole = 'admin' | 'manager' | 'creator' | 'client';
export type PostStatus = 'draft' | 'pending_manager' | 'pending_client' | 'approved' | 'scheduled' | 'published' | 'rejected';
export type PlatformType = 'facebook' | 'instagram' | 'threads' | 'linkedin' | 'google_business' | 'x';
export type PlatformAttemptStatus = 'pending' | 'processing' | 'published' | 'needs_manual' | 'failed' | 'skipped';

export interface PostPlatformAttempt {
  id: string;
  post_id: string;
  platform: PlatformType;
  content_override: string | null;
  hashtags_override: string[] | null;
  status: PlatformAttemptStatus;
  attempt_count: number;
  last_error: string | null;
  external_post_id: string | null;
  external_url: string | null;
  published_at: string | null;
  posted_manually: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface BrandAccount {
  id: string;
  brand_id: string;
  platform: PlatformType;
  account_name: string;
  account_id: string | null;
  access_token: string | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandMember {
  id: string;
  brand_id: string;
  user_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  brand_id: string;
  created_by: string | null;
  content: string;
  media_urls: string[];
  status: PostStatus;
  platforms: PlatformType[];
  scheduled_for: string | null;
  published_at: string | null;
  link_url: string | null;
  short_link: string | null;
  hashtags: string[];
  created_at: string;
  updated_at: string;
}

export interface ApprovalLog {
  id: string;
  post_id: string;
  user_id: string | null;
  from_status: PostStatus;
  to_status: PostStatus;
  comment: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  brand_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  brand_ids: string[];
  invited_by: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}