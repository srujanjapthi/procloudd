export interface Session {
  sessionId: string;
  userId: string;
  createdAt: number;
  userAgent?: string;
}

export interface SessionStore {
  init(): Promise<void>;
  save(session: Session, ttlSeconds: number): Promise<void>;
  get(sessionId: string): Promise<Session | null>;
  delete(sessions: Session[]): Promise<void>;
  listByUser(userId: string): Promise<Session[]>;
}
