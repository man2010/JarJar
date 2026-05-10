export interface AppUser {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  role: 'user' | 'admin';
  created_at?: string;
}
