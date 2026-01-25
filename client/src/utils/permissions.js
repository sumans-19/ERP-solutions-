// Permission utility functions
// These functions check user permissions based on their role

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const canCreate = () => {
  const user = getUser();
  if (!user) return false;
  // Development team can create items
  return ['development', 'admin'].includes(user.role);
};

export const canEdit = () => {
  const user = getUser();
  if (!user) return false;
  // Development and planning teams can edit
  return ['development', 'admin', 'planning'].includes(user.role);
};

export const canDelete = () => {
  const user = getUser();
  if (!user) return false;
  // Only admin and development can delete
  return ['development', 'admin'].includes(user.role);
};

export const canExportReports = () => {
  const user = getUser();
  if (!user) return false;
  // All authenticated users can export reports
  return true;
};

export const canViewItems = () => {
  const user = getUser();
  if (!user) return false;
  // All authenticated users can view items
  return true;
};

export const canManageUsers = () => {
  const user = getUser();
  if (!user) return false;
  // Only admin can manage users
  return user.role === 'admin';
};
