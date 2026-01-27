// Dynamic Permission Utility
// Reads from localStorage['role_permissions'] populated on login/refresh

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const getDynamicPermissions = () => {
  const perms = localStorage.getItem('role_permissions');
  return perms ? JSON.parse(perms) : null;
};

const checkAction = (section, action) => {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'development') return true;

  const config = getDynamicPermissions();
  if (!config || config.role !== user.role) return false;

  const sectionConfig = config.permissions.find(p => p.section === section);
  return sectionConfig ? (sectionConfig.visibility && sectionConfig.actions[action]) : false;
};

export const canCreate = (section = 'items') => checkAction(section, 'create');
export const canEdit = (section = 'items') => checkAction(section, 'update');
export const canDelete = (section = 'items') => checkAction(section, 'delete');
export const canRead = (section = 'items') => checkAction(section, 'read');

// Legacy compatibility exports
export const canExportReports = () => checkAction('reports', 'read');
export const canViewItems = () => checkAction('items', 'read');
export const canManageUsers = () => checkAction('users', 'update');
export const canViewInventory = () => checkAction('inventory', 'read');
export const canManageInventory = () => checkAction('inventory', 'update');

