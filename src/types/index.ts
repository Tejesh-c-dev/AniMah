// Enums
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum TitleType {
  ANIME = 'ANIME',
  MANHWA = 'MANHWA',
  MOVIE = 'MOVIE',
}

export enum WatchStatus {
  PLAN_TO_WATCH = 'PLAN_TO_WATCH',
  WATCHING = 'WATCHING',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  profileImage?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  reviewsCount: number;
  likesReceived: number;
}

// Title Types
export interface Title {
  id: string;
  name: string;
  normalizedName?: string;
  description: string;
  releaseYear: number;
  type: TitleType;
  coverImage?: string;
  genres: string[];
  creatorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TitleWithStats extends Title {
  reviewCount: number;
  averageRating: number;
  isFavorited?: boolean;
  watchlistStatus?: WatchStatus | null;
}

// Review Types
export interface Review {
  id: string;
  rating: number;
  content: string;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  titleId: string;
  user: User;
  replies: ReviewReply[];
}

export interface ReviewVote {
  id: string;
  isHelpful: boolean;
  createdAt: Date;
  userId: string;
  reviewId: string;
}

export interface ReviewReply {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  reviewId: string;
  user: User;
}

// Watchlist Types
export interface Watchlist {
  id: string;
  status: WatchStatus;
  addedAt: Date;
  updatedAt: Date;
  userId: string;
  titleId: string;
  title: Title;
}

// Favorite Types
export interface Favorite {
  id: string;
  addedAt: Date;
  userId: string;
  titleId: string;
  title: Title;
}

// API Request/Response Types
export interface AuthRequest {
  username?: string;
  email: string;
  password: string;
  setupKey?: string; // For admin bootstrap
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateTitleRequest {
  name: string;
  description: string;
  releaseYear: number;
  type: TitleType;
  genre?: string;
  genres: string[];
  coverImage?: string;
}

export interface CreateReviewRequest {
  rating: number;
  content: string;
}

export interface UpdateWatchlistRequest {
  status: WatchStatus;
}

export interface UserStats {
  reviewsCount: number;
  favoritesCount: number;
  watchlistCount: number;
  likesReceived: number;
}

// API Error Response
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}
