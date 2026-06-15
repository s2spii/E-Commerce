import type { Request, Response } from 'express';
import { z } from 'zod';
import { recordAudit } from '../../middleware/audit';
import { passwordSchema } from '../auth/password';
import * as admin from './admin.service';

export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(120).optional(),
});

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  roleName: z.string().min(1),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
});

export const setRoleSchema = z.object({ roleName: z.string().min(1) });
export const setActiveSchema = z.object({ isActive: z.boolean() });
export const auditQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().max(80).optional(),
});
export const settingSchema = z.object({ key: z.string().min(1).max(80), value: z.unknown() });

export async function dashboard(_req: Request, res: Response): Promise<void> {
  res.json({ data: await admin.dashboardStats() });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as { page: number; pageSize: number; search?: string };
  res.json({ data: await admin.listUsers(q.page, q.pageSize, q.search) });
}

export async function listRoles(_req: Request, res: Response): Promise<void> {
  res.json({ data: await admin.listRoles() });
}

export async function createStaff(req: Request, res: Response): Promise<void> {
  const user = await admin.createStaffUser(req.body);
  await recordAudit(req, { action: 'user.create', entityType: 'User', entityId: user.id, metadata: { role: user.role.name } });
  res.status(201).json({ data: user });
}

export async function setRole(req: Request, res: Response): Promise<void> {
  await admin.setUserRole(req.params.id!, req.body.roleName);
  await recordAudit(req, { action: 'user.role.change', entityType: 'User', entityId: req.params.id, metadata: { role: req.body.roleName } });
  res.json({ data: { id: req.params.id, role: req.body.roleName } });
}

export async function setActive(req: Request, res: Response): Promise<void> {
  await admin.setUserActive(req.params.id!, req.body.isActive, req.auth!.userId);
  await recordAudit(req, { action: 'user.active.change', entityType: 'User', entityId: req.params.id, metadata: { isActive: req.body.isActive } });
  res.json({ data: { id: req.params.id, isActive: req.body.isActive } });
}

export async function auditLogs(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as { page: number; pageSize: number; action?: string };
  res.json({ data: await admin.listAuditLogs(q.page, q.pageSize, q.action) });
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  res.json({ data: await admin.getSettings() });
}

export async function setSetting(req: Request, res: Response): Promise<void> {
  const setting = await admin.setSetting(req.body.key, req.body.value);
  await recordAudit(req, { action: 'settings.update', entityType: 'Setting', entityId: req.body.key });
  res.json({ data: setting });
}
