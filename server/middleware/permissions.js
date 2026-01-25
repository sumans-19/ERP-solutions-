// Permission checking middleware

const permissions = {
  admin: ['viewItems', 'createItems', 'editItems', 'deleteItems', 'viewReports', 'manageUsers'],
  development: ['viewItems', 'createItems', 'editItems', 'deleteItems', 'viewReports'],
  planning: ['viewItems', 'createItems', 'editItems', 'viewReports'],
  employee: ['viewItems', 'viewReports']
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'employee';
    
    const rolePermissions = permissions[userRole] || [];
    
    if (rolePermissions.includes(requiredPermission)) {
      next();
    } else {
      res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action',
        requiredPermission,
        userRole
      });
    }
  };
};

module.exports = { checkPermission, permissions };
