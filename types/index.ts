export type UserRole = "FREELANCER" | "EMPLOYER";
export type MediaType = "VIDEO" | "IMAGE";

export interface Skill {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  skills: Skill[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  freelancerProfile: FreelancerProfile | null;
  employerProfile: EmployerProfile | null;
}

export interface Reel {
  id: string;
  freelancerId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
  freelancer: {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    location: string | null;
    bio?: string | null;
    skills?: Skill[];
  };
}

export interface ReelsResponse {
  reels: Reel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Conversation {
  id: string;
  employerId: string;
  freelancerId: string;
  createdAt: string;
  updatedAt: string;
  employer: {
    id: string;
    email: string;
    employerProfile: { companyName: string; avatarUrl: string | null } | null;
  };
  freelancer: {
    id: string;
    email: string;
    freelancerProfile: { displayName: string; avatarUrl: string | null } | null;
  };
  lastMessage?: Message | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    role: UserRole;
    freelancerProfile?: { displayName: string; avatarUrl: string | null } | null;
    employerProfile?: { companyName: string; avatarUrl: string | null } | null;
  };
}

export interface ShortlistItem {
  id: string;
  freelancerId: string;
  createdAt: string;
  freelancer: {
    id: string;
    email: string;
    profile: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
      bio: string | null;
      location: string | null;
      skills: Skill[];
      latestReel: Reel | null;
    } | null;
  } | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateReelInput {
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  skillIds: string[];
}
