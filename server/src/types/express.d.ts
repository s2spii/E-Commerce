/**
 * Request augmentation: the authenticated principal resolved by the auth
 * middleware, plus the anonymous cart token.
 */
export interface AuthContext {
  userId: string;
  email: string;
  roleName: string;
  permissions: Set<string>;
  isSuperAdmin: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      cartToken?: string;
      id?: string;
    }
  }
}

export {};
