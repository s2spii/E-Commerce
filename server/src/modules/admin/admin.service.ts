import { BadRequestError, NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { hashPassword } from '../auth/password';

// --- Dashboard ---------------------------------------------------------------

export async function dashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [ordersToday, pendingOrders, customers, lowStock, revenueAgg, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: { name: 'CUSTOMER' } } }),
    prisma.productVariant.count({ where: { stock: { lte: 3 }, isActive: true } }),
    prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, number: true, status: true, grandTotal: true, createdAt: true } }),
  ]);

  return {
    ordersToday,
    pendingOrders,
    customers,
    lowStockVariants: lowStock,
    grossRevenue: revenueAgg._sum.grandTotal ?? 0,
    recentOrders,
  };
}

// --- Users & roles -----------------------------------------------------------

export async function listUsers(page: number, pageSize: number, search?: string) {
  const where = search ? { email: { contains: search, mode: 'insensitive' as const } } : {};
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true, mfaEnabled: true, role: { select: { name: true } }, createdAt: true },
    }),
  ]);
  return { items, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } };
}

export async function listRoles() {
  return prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true, isSystem: true, permissions: { select: { permission: { select: { key: true } } } } },
  });
}

export async function createStaffUser(input: { email: string; password: string; roleName: string; firstName?: string; lastName?: string }) {
  const role = await prisma.role.findUnique({ where: { name: input.roleName } });
  if (!role) throw new BadRequestError('Rôle inconnu');
  return prisma.user.create({
    data: {
      email: input.email.toLowerCase().trim(),
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: role.id,
    },
    select: { id: true, email: true, role: { select: { name: true } } },
  });
}

export async function setUserRole(userId: string, roleName: string) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new BadRequestError('Rôle inconnu');
  await prisma.user.update({ where: { id: userId }, data: { roleId: role.id } });
}

export async function setUserActive(userId: string, isActive: boolean, currentUserId: string) {
  if (userId === currentUserId && !isActive) throw new BadRequestError('Vous ne pouvez pas désactiver votre propre compte');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Utilisateur introuvable');
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) {
    // Revoke all active sessions on deactivation.
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}

// --- Audit & settings --------------------------------------------------------

export async function listAuditLogs(page: number, pageSize: number, action?: string) {
  const where = action ? { action: { contains: action } } : {};
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { email: true } } },
    }),
  ]);
  return { items, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } };
}

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: unknown) {
  return prisma.setting.upsert({ where: { key }, create: { key, value: value as object }, update: { value: value as object } });
}
