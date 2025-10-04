// Middleware to check if user is an admin
exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
        return next();
    }
    req.flash('error_msg', 'Access denied. Administrator privileges required.');
    return res.redirect('/dashboard');
};

// Middleware to check if user is a manager
exports.isManager = (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.role === 'manager') {
        return next();
    }
    req.flash('error_msg', 'Access denied. Manager privileges required.');
    return res.redirect('/dashboard');
};

// Middleware to check if user is admin or manager
exports.isAdminOrManager = (req, res, next) => {
    if (req.isAuthenticated() && req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
        return next();
    }
    req.flash('error_msg', 'Access denied. Manager or Administrator privileges required.');
    return res.redirect('/dashboard');
};

// Middleware to check if user is an employee (any authenticated user)
exports.isEmployee = (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
        return next();
    }
    req.flash('error_msg', 'Access denied. Please log in.');
    return res.redirect('/auth/login');
};

// Middleware to check specific role
exports.hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.isAuthenticated() || !req.user) {
            req.flash('error_msg', 'Access denied. Please log in.');
            return res.redirect('/auth/login');
        }

        // Convert roles to array if single role provided
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        req.flash('error_msg', 'Access denied. You do not have permission to access this resource.');
        return res.redirect('/dashboard');
    };
};

// Middleware to check if user owns the resource or is admin
exports.isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.isAuthenticated() || !req.user) {
            req.flash('error_msg', 'Access denied. Please log in.');
            return res.redirect('/auth/login');
        }

        // Admin can access anything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.query[resourceUserIdField];
        
        if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
            return next();
        }

        req.flash('error_msg', 'Access denied. You can only access your own resources.');
        return res.redirect('/dashboard');
    };
};