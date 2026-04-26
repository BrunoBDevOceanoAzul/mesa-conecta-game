export interface PostAuthor {
  name: string | null;
  avatarUrl: string | null;
  slug: string | null;
  city: string | null;
  role: string | null;
}

export interface PostMesa {
  id: string | null;
  title: string | null;
  system: string | null;
  startAt: Date | null;
  slug: string | null;
}

export interface PostData {
  id: string;
  userId: string;
  mesaId: string | null;
  type: string;
  content: string;
  mediaUrls: string[];
  metadataJson: Record<string, unknown> | null;
  isPublic: boolean;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  author: PostAuthor | null;
  mesa: PostMesa | null;
  userLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Post {
  constructor(private readonly data: PostData) {}

  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get content(): string { return this.data.content; }
  get type(): string { return this.data.type; }
  get isPublic(): boolean { return this.data.isPublic; }
  get isPinned(): boolean { return this.data.isPinned; }
  get likeCount(): number { return this.data.likeCount; }
  get commentCount(): number { return this.data.commentCount; }
  get author(): PostAuthor | null { return this.data.author; }
  get mesa(): PostMesa | null { return this.data.mesa; }
  get createdAt(): Date { return this.data.createdAt; }

  toJSON() {
    return { ...this.data };
  }
}

export interface CreatePostInput {
  userId: string;
  content: string;
  type?: string;
  mesaId?: string;
  mediaUrls?: string[];
  isPublic?: boolean;
}

export interface PostRepository {
  create(data: CreatePostInput): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  listFeed(params: { limit: number; offset: number; userId?: string; role?: string; type?: string; sponsored?: boolean }): Promise<{ posts: Post[]; total: number }>;
  listByUser(userId: string, params: { limit: number; offset: number }): Promise<{ posts: Post[]; total: number }>;
  delete(id: string, userId: string): Promise<boolean>;
}
