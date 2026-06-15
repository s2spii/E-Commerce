import type { Request, Response } from 'express';
import { z } from 'zod';
import { recordAudit } from '../../middleware/audit';
import * as cms from './cms.service';

export const pageSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(80).optional(),
  title: z.string().min(2).max(160),
  content: z.string().max(50000),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
});

export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(160),
  subtitle: z.string().max(240).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

// Public
export async function getPage(req: Request, res: Response): Promise<void> {
  res.json({ data: await cms.getPublishedPage(req.params.slug!) });
}
export async function listBanners(_req: Request, res: Response): Promise<void> {
  res.json({ data: await cms.listActiveBanners() });
}

// Admin
export async function listPages(_req: Request, res: Response): Promise<void> {
  res.json({ data: await cms.listPages() });
}
export async function upsertPage(req: Request, res: Response): Promise<void> {
  const page = await cms.upsertPage(req.body);
  await recordAudit(req, { action: 'cms.page.upsert', entityType: 'CmsPage', entityId: page.id });
  res.json({ data: page });
}
export async function upsertBanner(req: Request, res: Response): Promise<void> {
  const banner = await cms.upsertBanner(req.body);
  await recordAudit(req, { action: 'cms.banner.upsert', entityType: 'Banner', entityId: banner.id });
  res.json({ data: banner });
}
