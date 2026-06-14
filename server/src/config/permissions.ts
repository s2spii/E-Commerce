/**
 * Central permission catalog. Every privileged action in the system maps to one
 * of these keys; routes are guarded with `requirePermission(...)`. Roles are
 * just named bundles of these permissions (RBAC).
 *
 * Keep this list as the single source of truth — the seed script provisions the
 * database from it, and tests assert that guards reference real keys.
 */
export const PERMISSIONS = {
  // Catalog
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  PRODUCT_DELETE: 'product:delete',
  CATEGORY_WRITE: 'category:write',
  INVENTORY_WRITE: 'inventory:write',

  // Orders
  ORDER_READ: 'order:read',
  ORDER_WRITE: 'order:write',
  ORDER_REFUND: 'order:refund',
  RETURN_MANAGE: 'return:manage',

  // Customers
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_WRITE: 'customer:write',

  // Promotions & CMS
  PROMOTION_WRITE: 'promotion:write',
  CMS_WRITE: 'cms:write',

  // Taxation
  TAX_WRITE: 'tax:write',

  // Administration
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  AUDIT_READ: 'audit:read',
  SETTINGS_WRITE: 'settings:write',
  DASHBOARD_VIEW: 'dashboard:view',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

/**
 * Default system roles. SUPER_ADMIN implicitly holds every permission (handled
 * in the auth guard). Others get an explicit least-privilege subset.
 */
export const SYSTEM_ROLES: Record<string, { description: string; permissions: PermissionKey[] }> = {
  SUPER_ADMIN: {
    description: 'Full, unrestricted access. Reserved for platform owners.',
    permissions: ALL_PERMISSIONS,
  },
  ADMIN: {
    description: 'Day-to-day store administration.',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_WRITE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.CATEGORY_WRITE,
      PERMISSIONS.INVENTORY_WRITE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_WRITE,
      PERMISSIONS.ORDER_REFUND,
      PERMISSIONS.RETURN_MANAGE,
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.CUSTOMER_WRITE,
      PERMISSIONS.PROMOTION_WRITE,
      PERMISSIONS.CMS_WRITE,
      PERMISSIONS.AUDIT_READ,
    ],
  },
  CATALOG_MANAGER: {
    description: 'Manages products, categories, media and stock only.',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_WRITE,
      PERMISSIONS.CATEGORY_WRITE,
      PERMISSIONS.INVENTORY_WRITE,
    ],
  },
  SUPPORT_AGENT: {
    description: 'Customer support: orders, returns and customer records.',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.RETURN_MANAGE,
      PERMISSIONS.CUSTOMER_READ,
    ],
  },
  CUSTOMER: {
    description: 'Default role for storefront shoppers. No admin access.',
    permissions: [],
  },
};

export const DEFAULT_CUSTOMER_ROLE = 'CUSTOMER';
export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
