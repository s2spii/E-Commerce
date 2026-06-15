/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { ALL_PERMISSIONS, SYSTEM_ROLES } from '../src/config/permissions';
import { DEFAULT_TAX_RATES } from '../src/modules/tax/tax.data';
import { slugify } from '../src/lib/slug';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@maisonluma.example';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!Luma2026';

async function seedRbac(): Promise<void> {
  console.log('→ Seeding permissions & roles…');
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
  }
  for (const [name, def] of Object.entries(SYSTEM_ROLES)) {
    const role = await prisma.role.upsert({
      where: { name },
      create: { name, description: def.description, isSystem: true },
      update: { description: def.description, isSystem: true },
    });
    // Reset the role's permission set to match the catalog.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of def.permissions) {
      const perm = await prisma.permission.findUnique({ where: { key } });
      if (perm) await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: perm.id } });
    }
  }
}

async function seedAdmin(): Promise<void> {
  console.log('→ Seeding super admin…');
  const role = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id }),
      firstName: 'Luma',
      lastName: 'Admin',
      emailVerified: true,
      roleId: role.id,
    },
    update: { roleId: role.id },
  });
}

async function seedTaxRates(): Promise<void> {
  console.log('→ Seeding tax rates…');
  for (const r of DEFAULT_TAX_RATES) {
    await prisma.taxRate.upsert({
      where: { countryCode_taxClass_validFrom: { countryCode: r.countryCode, taxClass: r.taxClass, validFrom: new Date(0) } },
      create: { countryCode: r.countryCode, taxClass: r.taxClass, name: r.name, rate: r.rate, isDefault: r.isDefault ?? false, validFrom: new Date(0) },
      update: { name: r.name, rate: r.rate, isDefault: r.isDefault ?? false },
    });
  }
}

async function seedCatalog(): Promise<void> {
  console.log('→ Seeding catalog…');
  const categories = [
    { name: 'Maroquinerie', description: 'Cuir pleine fleur, façonné à la main.' },
    { name: 'Cachemire', description: 'Fibres nobles, tissées en Italie.' },
    { name: 'Maison', description: 'Objets rares pour un intérieur d’exception.' },
  ];
  const categoryMap = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      create: { name: c.name, slug: slugify(c.name), description: c.description, position: i, isActive: true },
      update: { description: c.description },
    });
    categoryMap.set(c.name, cat.id);
  }

  const products = [
    {
      name: 'Sac Lumière en cuir nappa',
      category: 'Maroquinerie',
      brand: 'Maison Luma',
      description: 'Un sac structuré en cuir nappa, doublure en suède, fermeture aimantée laiton.',
      story: 'Façonné dans notre atelier, le sac Lumière demande douze heures de travail à un seul artisan.',
      taxClass: 'STANDARD',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80',
      variants: [
        { sku: 'LUMA-BAG-NOIR', name: 'Noir', price: 89000, stock: 12 },
        { sku: 'LUMA-BAG-COGNAC', name: 'Cognac', price: 89000, stock: 7 },
      ],
      featured: true,
    },
    {
      name: 'Écharpe en cachemire double face',
      category: 'Cachemire',
      brand: 'Maison Luma',
      description: 'Cachemire 4 fils, tissage double face, franges nouées main.',
      story: 'Tissée en Toscane à partir des plus longues fibres de cachemire mongol.',
      taxClass: 'STANDARD',
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&q=80',
      variants: [
        { sku: 'LUMA-SCARF-IVOIRE', name: 'Ivoire', price: 24500, stock: 20 },
        { sku: 'LUMA-SCARF-NUIT', name: 'Bleu nuit', price: 24500, stock: 15 },
      ],
      featured: true,
    },
    {
      name: 'Bougie sculpturale — Cèdre & Ambre',
      category: 'Maison',
      brand: 'Maison Luma',
      description: 'Cire végétale, 60 heures de combustion, contenant en grès émaillé réutilisable.',
      story: 'Une fragrance signature développée avec un nez grassois.',
      taxClass: 'STANDARD',
      image: 'https://images.unsplash.com/photo-1602874801006-e26c4c5b5e6a?w=1200&q=80',
      variants: [{ sku: 'LUMA-CANDLE-CEDRE', name: '230g', price: 6900, stock: 40 }],
      featured: false,
    },
  ];

  for (const p of products) {
    const slug = slugify(p.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        story: p.story,
        brand: p.brand,
        taxClass: p.taxClass,
        status: 'ACTIVE',
        isFeatured: p.featured,
        publishedAt: new Date(),
        categoryId: categoryMap.get(p.category),
        images: { create: [{ url: p.image, alt: p.name, position: 0 }] },
        variants: { create: p.variants.map((v) => ({ sku: v.sku, name: v.name, price: v.price, stock: v.stock })) },
      },
    });
  }
}

async function seedMarketing(): Promise<void> {
  console.log('→ Seeding promotions & content…');
  await prisma.coupon.upsert({
    where: { code: 'BIENVENUE10' },
    create: { code: 'BIENVENUE10', description: '-10% sur la première commande', type: 'PERCENTAGE', value: 1000, perUserLimit: 1 },
    update: {},
  });
  await prisma.cmsPage.upsert({
    where: { slug: 'notre-maison' },
    create: {
      slug: 'notre-maison',
      title: 'Notre Maison',
      content: '# Notre Maison\n\nMaison Luma réunit des artisans d’exception autour d’une idée simple : la beauté durable.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    update: {},
  });
}

async function main(): Promise<void> {
  await seedRbac();
  await seedAdmin();
  await seedTaxRates();
  await seedCatalog();
  await seedMarketing();
  console.log('\n✓ Seed complete.');
  console.log(`  Admin login: ${ADMIN_EMAIL}`);
  // Never log the actual secret. Point operators to where it is configured.
  console.log(
    `  Admin password: ${process.env.SEED_ADMIN_PASSWORD ? 'value of $SEED_ADMIN_PASSWORD' : 'built-in dev default (see .env.example / README)'}`,
  );
  console.log('  → Change it immediately after first login, then enable MFA.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
