import { NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { slugify } from '../../lib/slug';

export async function getPublishedPage(slug: string) {
  const page = await prisma.cmsPage.findFirst({ where: { slug, status: 'PUBLISHED' } });
  if (!page) throw new NotFoundError('Page introuvable');
  return page;
}

export async function listActiveBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { position: 'asc' },
  });
}

export interface PageInput {
  id?: string;
  slug?: string;
  title: string;
  content: string;
  status?: 'DRAFT' | 'PUBLISHED';
  seoTitle?: string;
  seoDescription?: string;
}

export async function upsertPage(input: PageInput) {
  const slug = input.slug ? slugify(input.slug) : slugify(input.title);
  const data = {
    title: input.title,
    content: input.content,
    status: input.status ?? 'DRAFT',
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
  };
  if (input.id) return prisma.cmsPage.update({ where: { id: input.id }, data });
  return prisma.cmsPage.create({ data: { ...data, slug } });
}

export async function listPages() {
  return prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
}

export interface BannerInput {
  id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export async function upsertBanner(input: BannerInput) {
  const data = {
    title: input.title,
    subtitle: input.subtitle,
    imageUrl: input.imageUrl,
    linkUrl: input.linkUrl,
    position: input.position ?? 0,
    isActive: input.isActive ?? true,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
  };
  if (input.id) return prisma.banner.update({ where: { id: input.id }, data });
  return prisma.banner.create({ data });
}
