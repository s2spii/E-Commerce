import type { Request } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

interface AuditInput {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

/**
 * Append-only audit trail for security- and compliance-sensitive actions
 * (admin changes, orders, refunds, logins). Failures to write an audit record
 * must never break the user-facing action, but they are logged loudly.
 *
 * NOTE: never pass secrets/PII beyond what is necessary into `metadata`.
 */
export async function recordAudit(req: Request | null, input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata ?? {}) as object,
        actorId: input.actorId ?? req?.auth?.userId ?? null,
        ip: req?.ip,
        userAgent: req?.headers['user-agent']?.slice(0, 512),
      },
    });
  } catch (err) {
    logger.error({ err, action: input.action }, 'Failed to write audit log');
  }
}
