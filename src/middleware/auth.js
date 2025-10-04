// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please log in to access this page');
    res.redirect('/auth/login');
};

// Middleware to check if user is NOT authenticated (for login/signup pages)
exports.isNotAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/dashboard');
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'You do not have permission to access this page');
    res.redirect('/dashboard');
};

// Middleware to check if user is manager or admin
exports.isManagerOrAdmin = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'manager' || req.user.role === 'admin')) {
        return next();
    }
    req.flash('error', 'You do not have permission to access this page');
    res.redirect('/dashboard');
};

// Middleware to check specific role
exports.hasRole = (...roles) => {
    return (req, res, next) => {
        if (req.isAuthenticated() && roles.includes(req.user.role)) {
            return next();
        }
        req.flash('error', 'You do not have permission to access this page');
        res.redirect('/dashboard');
    };
};