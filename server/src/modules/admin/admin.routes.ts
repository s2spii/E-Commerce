import { Router } from 'express';
import { PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { idParam, validate } from '../../middleware/validate';
import * as c from './admin.controller';

export const adminRouter = Router();
adminRouter.use(authenticate);

adminRouter.get('/dashboard', requirePermission(PERMISSIONS.DASHBOARD_VIEW), asyncHandler(c.dashboard));

// User & role administration
adminRouter.get('/users', requirePermission(PERMISSIONS.USER_MANAGE), validate({ query: c.listUsersQuery }), asyncHandler(c.listUsers));
adminRouter.post('/users', requirePermission(PERMISSIONS.USER_MANAGE), validate({ body: c.createStaffSchema }), asyncHandler(c.createStaff));
adminRouter.patch('/users/:id/role', requirePermission(PERMISSIONS.ROLE_MANAGE), validate({ params: idParam, body: c.setRoleSchema }), asyncHandler(c.setRole));
adminRouter.patch('/users/:id/active', requirePermission(PERMISSIONS.USER_MANAGE), validate({ params: idParam, body: c.setActiveSchema }), asyncHandler(c.setActive));
adminRouter.get('/roles', requirePermission(PERMISSIONS.USER_MANAGE), asyncHandler(c.listRoles));

// Audit trail
adminRouter.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_READ), validate({ query: c.auditQuery }), asyncHandler(c.auditLogs));

// Global settings
adminRouter.get('/settings', requirePermission(PERMISSIONS.SETTINGS_WRITE), asyncHandler(c.getSettings));
adminRouter.put('/settings', requirePermission(PERMISSIONS.SETTINGS_WRITE), validate({ body: c.settingSchema }), asyncHandler(c.setSetting));
