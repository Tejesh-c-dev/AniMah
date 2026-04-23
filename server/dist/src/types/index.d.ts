export declare enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
}
export declare enum TitleType {
    ANIME = "ANIME",
    MANHWA = "MANHWA",
    MOVIE = "MOVIE"
}
export declare enum WatchStatus {
    PLAN_TO_WATCH = "PLAN_TO_WATCH",
    WATCHING = "WATCHING",
    COMPLETED = "COMPLETED",
    DROPPED = "DROPPED"
}
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
export interface Title {
    id: string;
    name: string;
    description: string;
    releaseYear: number;
    type: TitleType;
    coverImage?: string;
    genres: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface TitleWithStats extends Title {
    reviewCount: number;
    averageRating: number;
    isFavorited?: boolean;
    watchlistStatus?: WatchStatus | null;
}
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
export interface Watchlist {
    id: string;
    status: WatchStatus;
    addedAt: Date;
    updatedAt: Date;
    userId: string;
    titleId: string;
    title: Title;
}
export interface Favorite {
    id: string;
    addedAt: Date;
    userId: string;
    titleId: string;
    title: Title;
}
export interface AuthRequest {
    username?: string;
    email: string;
    password: string;
    setupKey?: string;
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
export interface ApiError {
    message: string;
    code?: string;
    details?: unknown;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
}
//# sourceMappingURL=index.d.ts.map