// GET Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const user = req.user;
        
        // Temporary placeholder - your teammate will implement the actual dashboard
        res.render(`dashboard/${user.role}`, {
            title: 'Dashboard',
            user: user,
            company: await req.user.populate('company'),
            currentPage: 'dashboard',
            pageTitle: 'Dashboard'
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
};