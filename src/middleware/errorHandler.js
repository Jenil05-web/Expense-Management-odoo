// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        req.flash('error_msg', errors.join(', '));
        return res.redirect('back');
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        req.flash('error_msg', 'Duplicate entry. This record already exists.');
        return res.redirect('back');
    }

    // Mongoose cast error (invalid ID)
    if (err.name === 'CastError') {
        req.flash('error_msg', 'Invalid ID format');
        return res.redirect('back');
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            req.flash('error_msg', 'File size too large. Maximum size is 5MB.');
        } else {
            req.flash('error_msg', 'File upload error: ' + err.message);
        }
        return res.redirect('back');
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        req.flash('error_msg', 'Invalid token. Please log in again.');
        return res.redirect('/auth/login');
    }

    if (err.name === 'TokenExpiredError') {
        req.flash('error_msg', 'Session expired. Please log in again.');
        return res.redirect('/auth/login');
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (req.accepts('html')) {
        res.status(statusCode).render('layouts/error', {
            title: 'Error',
            message: message,
            error: process.env.NODE_ENV === 'development' ? err : { status: statusCode }
        });
    } else if (req.accepts('json')) {
        res.status(statusCode).json({
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } else {
        res.status(statusCode).send(message);
    }
};

module.exports = errorHandler;