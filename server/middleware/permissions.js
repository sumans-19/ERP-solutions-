const RolePermission = require('../models/RolePermission');

/**
 * Maps legacy permission strings to the new dynamic section/action structure.
 * This ensures backward compatibility with existing route definitions.
 */
const permissionMap = {
  'viewItems': { section: 'items', action: 'read' },
  'createItems': { section: 'items', action: 'create' },
  'editItems': { section: 'items', action: 'update' },
  'deleteItems': { section: 'items', action: 'delete' },
  'viewOrders': { section: 'orders', action: 'read' },
  'createOrders': { section: 'orders', action: 'create' },
  'editOrders': { section: 'orders', action: 'update' },
  'deleteOrders': { section: 'orders', action: 'delete' },
  'viewReports': { section: 'reports', action: 'read' },
  'manageUsers': { section: 'users', action: 'update' },
  'manageInventory': { section: 'inventory', action: 'update' }
};

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    const userRole = req.user?.role || 'employee';

    // 1. SUPREME AUTHORITY BYPASS
    // The development role (dev@elints.com) has absolute priority and bypasses all checks.
    if (userRole === 'development') {
      return next();
    }

    try {
      // 2. FETCH DYNAMIC PERMISSIONS
      const roleConfig = await RolePermission.findOne({ role: userRole });

      if (!roleConfig) {
        return res.status(403).json({
          message: `Security Alert: Access configuration for role '${userRole}' is missing. Access denied for ${requiredPermission}.`,
          userRole
        });
      }

      // 3. RESOLVE MAPPING
      const mapping = permissionMap[requiredPermission];
      if (!mapping) {
        // If no mapping exists, we might be using a new-style permission check
        // For now, let's assume it's one of the legacy strings
        return res.status(500).json({ message: `Developer Error: Permission string '${requiredPermission}' is not mapped.` });
      }

      // 4. VALIDATE AGAINST CONFIG
      const sectionConfig = roleConfig.permissions.find(p => p.section === mapping.section);

      if (!sectionConfig || !sectionConfig.visibility) {
        return res.status(403).json({
          message: `Access Denied: The '${mapping.section}' section is currently restricted for your role.`,
          section: mapping.section
        });
      }

      if (sectionConfig.actions[mapping.action]) {
        return next();
      }

      res.status(403).json({
        message: `Permission Denied: You do not have '${mapping.action}' authority on '${mapping.section}'.`,
        requiredAction: mapping.action,
        section: mapping.section
      });

    } catch (error) {
      console.error('CRITICAL PERMISSION CHECK FAILURE:', error);
      res.status(500).json({ message: 'Internal Security Error: Failed to verify permissions.' });
    }
  };
};

module.exports = { checkPermission };
