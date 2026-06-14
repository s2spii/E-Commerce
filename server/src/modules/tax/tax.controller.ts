import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../middleware/audit';
import { invalidateRateCache, quoteTax, validateVatNumber } from './tax.service';

export const quoteSchema = z.object({
  destinationCountry: z.string().length(2),
  customerType: z.enum(['B2C', 'B2B']).optional(),
  vatNumber: z.string().max(20).optional(),
  lines: z
    .array(
      z.object({
        id: z.string().default('l'),
        taxClass: z.string().default('STANDARD'),
        unitAmount: z.coerce.number().int().nonnegative(),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
});

export const vatCheckSchema = z.object({ vatNumber: z.string().min(4).max(20) });

export const rateSchema = z.object({
  countryCode: z.string().length(2),
  taxClass: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  rate: z.coerce.number().int().min(0).max(10000),
  isDefault: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

// --- Public ------------------------------------------------------------------

export async function quote(req: Request, res: Response): Promise<void> {
  const result = await quoteTax(req.body);
  res.json({ data: result });
}

export async function checkVat(req: Request, res: Response): Promise<void> {
  res.json({ data: await validateVatNumber(req.body.vatNumber) });
}

// --- Admin -------------------------------------------------------------------

export async function listRates(_req: Request, res: Response): Promise<void> {
  res.json({ data: await prisma.taxRate.findMany({ orderBy: [{ countryCode: 'asc' }, { taxClass: 'asc' }] }) });
}

export async function upsertRate(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof rateSchema>;
  const rate = await prisma.taxRate.upsert({
    where: {
      countryCode_taxClass_validFrom: {
        countryCode: body.countryCode.toUpperCase(),
        taxClass: body.taxClass,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(0),
      },
    },
    create: {
      countryCode: body.countryCode.toUpperCase(),
      taxClass: body.taxClass,
      name: body.name,
      rate: body.rate,
      isDefault: body.isDefault ?? false,
      validFrom: body.validFrom ? new Date(body.validFrom) : new Date(0),
      validTo: body.validTo ? new Date(body.validTo) : null,
    },
    update: { name: body.name, rate: body.rate, isDefault: body.isDefault ?? false, validTo: body.validTo ? new Date(body.validTo) : null },
  });
  invalidateRateCache();
  await recordAudit(req, { action: 'tax.rate.upsert', entityType: 'TaxRate', entityId: rate.id, metadata: { country: rate.countryCode, rate: rate.rate } });
  res.json({ data: rate });
}

export async function deleteRate(req: Request, res: Response): Promise<void> {
  await prisma.taxRate.delete({ where: { id: req.params.id! } });
  invalidateRateCache();
  await recordAudit(req, { action: 'tax.rate.delete', entityType: 'TaxRate', entityId: req.params.id });
  res.status(204).send();
}
