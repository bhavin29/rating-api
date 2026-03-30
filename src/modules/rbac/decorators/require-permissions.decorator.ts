import { SetMetadata } from '@nestjs/common';

export const RBAC_KEY = 'rbac_permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(RBAC_KEY, permissions);
