// src/types/index.ts
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  region: string;
  city: string;
  political_experience: 'none' | 'local' | 'regional' | 'national';
  is_verified: boolean;
  date_joined: string;
}

export interface UserProfile {
  id: number;
  user: number;
  bio: string;
  education: string;
  professional_experience: string;
  political_interests: string;
  skills: string;
  completion_percentage: number;
  avatar?: string;
}

export interface ForumTopic {
  id: number;
  title: string;
  description: string;
  category: number;
  author: number;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  posts_count: number;
  latest_post_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  category: number;
  start_date: string;
  end_date: string;
  location: string;
  is_online: boolean;
  max_participants?: number;
  registration_count: number;
  image?: string;
}