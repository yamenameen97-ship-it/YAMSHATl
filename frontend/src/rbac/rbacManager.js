/**
 * RBAC Manager - Dynamic Permissions & Policy Engine
 */

const roleInheritance = {
  admin: ['moderator', 'user'],
  moderator: ['user'],
  user: []
};

const permissionCache = new Map();

export const checkPermission = (userRole, requiredPermission, context = {}) => {
  const cacheKey = `${userRole}:${requiredPermission}:${JSON.stringify(context)}`;
  if (permissionCache.has(cacheKey)) return permissionCache.get(cacheKey);

  // Policy Engine Logic
  const hasRole = (role) => {
    if (userRole === role) return true;
    return roleInheritance[userRole]?.includes(role);
  };

  let allowed = false;

  // Dynamic Permission Rules
  switch (requiredPermission) {
    case 'admin:access':
      allowed = hasRole('admin');
      break;
    case 'post:delete':
      allowed = hasRole('moderator') || (context.isOwner && hasRole('user'));
      break;
    case 'live:stop':
      allowed = hasRole('moderator');
      break;
    default:
      allowed = hasRole('admin');
  }

  permissionCache.set(cacheKey, allowed);
  return allowed;
};

export const clearPermissionCache = () => permissionCache.clear();
