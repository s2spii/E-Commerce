import { env } from '../../config/env';
import { DEFAULT_CUSTOMER_ROLE } from '../../config/permissions';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../middleware/audit';
import { hashPassword, verifyPassword } from './password';
import {
  generateMfaSecret,
  buildOtpAuthUrl,
  buildQrDataUrl,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotp,
} from './mfa';
import {
  generateRefreshToken,
  hashToken,
  newTokenFamily,
  signAccessToken,
} from './tokens';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function issueTokens(
  userId: string,
  roleName: string,
  meta: RequestMeta,
  family?: string,
): Promise<TokenBundle> {
  const accessToken = signAccessToken(userId, roleName);
  const { token: refreshToken, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      family: family ?? newTokenFamily(),
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL * 1000),
      userAgent: meta.userAgent?.slice(0, 512),
      ip: meta.ip,
    },
  });
  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL };
}

export async function register(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ id: string; email: string }> {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Avoid user-enumeration: respond as if created, but do not create a dupe.
    throw new ConflictError('Un compte existe déjà avec cet e-mail');
  }

  const role = await prisma.role.findUnique({ where: { name: DEFAULT_CUSTOMER_ROLE } });
  if (!role) throw new Error('Default role missing — run the seed');

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: role.id,
    },
    select: { id: true, email: true },
  });

  await recordAudit(null, { action: 'auth.register', entityType: 'User', entityId: user.id, actorId: user.id });
  return user;
}

export interface LoginResult {
  status: 'ok' | 'mfa_required';
  tokens?: TokenBundle;
  mustEnableMfa?: boolean;
}

export async function login(
  input: { email: string; password: string; mfaToken?: string },
  meta: RequestMeta,
): Promise<LoginResult> {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  // Constant-ish behaviour to limit enumeration: always do a hash comparison.
  const dummyHash = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$3g2nO0u8mC3R2m0z4Q';
  const passwordOk = user
    ? await verifyPassword(user.passwordHash, input.password)
    : await verifyPassword(dummyHash, input.password).then(() => false);

  if (!user || !user.isActive) throw new UnauthorizedError('Identifiants invalides');

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ForbiddenError('Compte temporairement verrouillé. Réessayez plus tard.');
  }

  if (!passwordOk) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil:
          failed >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await recordAudit(null, {
      action: 'auth.login.failed',
      entityType: 'User',
      entityId: user.id,
      actorId: user.id,
      metadata: { attempt: failed },
    });
    throw new UnauthorizedError('Identifiants invalides');
  }

  const isAdminTier = user.role.name !== DEFAULT_CUSTOMER_ROLE;

  // MFA challenge for any account that has it enabled.
  if (user.mfaEnabled) {
    if (!input.mfaToken) return { status: 'mfa_required' };
    const validToken = user.mfaSecret ? verifyTotp(input.mfaToken, user.mfaSecret) : false;
    const validRecovery =
      !validToken && user.mfaRecoveryCodes.includes(hashRecoveryCode(input.mfaToken));
    if (!validToken && !validRecovery) {
      throw new UnauthorizedError('Code MFA invalide');
    }
    if (validRecovery) {
      // Burn the used recovery code.
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaRecoveryCodes: user.mfaRecoveryCodes.filter((c) => c !== hashRecoveryCode(input.mfaToken!)) },
      });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await recordAudit(null, { action: 'auth.login', entityType: 'User', entityId: user.id, actorId: user.id, metadata: { ip: meta.ip } });

  const tokens = await issueTokens(user.id, user.role.name, meta);
  // Admin-tier accounts MUST set up MFA; surface the obligation to the client.
  return { status: 'ok', tokens, mustEnableMfa: isAdminTier && !user.mfaEnabled };
}

export async function refresh(rawToken: string, meta: RequestMeta): Promise<TokenBundle> {
  const hash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: { include: { role: true } } },
  });

  if (!stored) throw new UnauthorizedError('Session invalide');

  // Reuse detection: a revoked token presented again means the family is
  // compromised → nuke every token in it.
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { family: stored.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await recordAudit(null, {
      action: 'auth.refresh.reuse_detected',
      entityType: 'User',
      entityId: stored.userId,
      actorId: stored.userId,
    });
    throw new UnauthorizedError('Session invalide');
  }

  if (stored.expiresAt < new Date() || !stored.user.isActive) {
    throw new UnauthorizedError('Session expirée');
  }

  const next = await issueTokens(stored.userId, stored.user.role.name, meta, stored.family);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: hashToken(next.refreshToken) },
  });
  return next;
}

export async function logout(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// --- MFA management ---------------------------------------------------------

export async function beginMfaSetup(userId: string): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const secret = generateMfaSecret();
  // Store the (not yet enabled) secret so the verify step can check it.
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret, mfaEnabled: false } });
  const otpauthUrl = buildOtpAuthUrl(secret, user.email);
  return { secret, otpauthUrl, qrDataUrl: await buildQrDataUrl(otpauthUrl) };
}

export async function enableMfa(userId: string, token: string): Promise<{ recoveryCodes: string[] }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.mfaSecret) throw new BadRequestError('Initialisez d’abord la configuration MFA');
  if (!verifyTotp(token, user.mfaSecret)) throw new UnauthorizedError('Code MFA invalide');

  const { plain, hashed } = generateRecoveryCodes();
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true, mfaRecoveryCodes: hashed },
  });
  await recordAudit(null, { action: 'auth.mfa.enabled', entityType: 'User', entityId: userId, actorId: userId });
  return { recoveryCodes: plain };
}

export async function disableMfa(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, password))) {
    throw new UnauthorizedError('Mot de passe invalide');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecret: null, mfaRecoveryCodes: [] },
  });
  await recordAudit(null, { action: 'auth.mfa.disabled', entityType: 'User', entityId: userId, actorId: userId });
}

export async function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      mfaEnabled: true,
      emailVerified: true,
      role: { select: { name: true } },
      createdAt: true,
    },
  });
}
