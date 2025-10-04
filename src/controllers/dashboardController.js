const User = require('../models/User');
const Expense = require('../models/Expense');
const Company = require('../models/Company');

// GET /dashboard - Render dashboard based on user role
exports.getDashboard = async (req, res) => {
    try {
        const user = req.user;

        if (user.role === 'admin') {
            return await renderAdminDashboard(req, res);
        } else if (user.role === 'manager') {
            return await renderManagerDashboard(req, res);
        } else {
            return await renderEmployeeDashboard(req, res);
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error_msg', 'Error loading dashboard');
        res.redirect('/auth/login');
    }
};

// -------------------- Admin Dashboard --------------------
async function renderAdminDashboard(req, res) {
    try {
        const company = await Company.findById(req.user.company);

        const totalUsers = await User.countDocuments({ company: req.user.company });
        const activeUsers = await User.countDocuments({ company: req.user.company, isActive: true });
        const totalExpenses = await Expense.countDocuments({ company: req.user.company });
        const pendingExpenses = await Expense.countDocuments({ company: req.user.company, status: 'pending' });
        const approvedExpenses = await Expense.countDocuments({ company: req.user.company, status: 'approved' });

        const totalAmountAgg = await Expense.aggregate([
            { $match: { company: req.user.company } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingAmountAgg = await Expense.aggregate([
            { $match: { company: req.user.company, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const recentExpenses = await Expense.find({ company: req.user.company })
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        res.render('dashboard/admin', {
            title: 'Admin Dashboard',
            currentUser: req.user,
            currentPage: 'admin', // for sidebar active link
            company,
            stats: {
                totalUsers,
                activeUsers,
                totalExpenses,
                pendingExpenses,
                approvedExpenses,
                totalAmount: totalAmountAgg[0]?.total || 0,
                pendingAmount: pendingAmountAgg[0]?.total || 0
            },
            recentExpenses
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('error_msg', 'Error loading admin dashboard');
        res.redirect('/auth/login');
    }
}

// -------------------- Manager Dashboard --------------------
async function renderManagerDashboard(req, res) {
    try {
        const company = await Company.findById(req.user.company);

        const pendingExpenses = await Expense.find({ company: req.user.company, status: 'pending' })
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        const teamExpenses = await Expense.countDocuments({ company: req.user.company });
        const pendingCount = await Expense.countDocuments({ company: req.user.company, status: 'pending' });

        res.render('dashboard/manager', {
            title: 'Manager Dashboard',
            currentUser: req.user,
            currentPage: 'manager', // for sidebar active link
            company,
            pendingExpenses,
            stats: {
                teamExpenses,
                pendingCount
            }
        });
    } catch (error) {
        console.error('Manager dashboard error:', error);
        req.flash('error_msg', 'Error loading manager dashboard');
        res.redirect('/auth/login');
    }
}

// -------------------- Employee Dashboard --------------------
async function renderEmployeeDashboard(req, res) {
    try {
        const company = await Company.findById(req.user.company);

        const myExpenses = await Expense.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        const totalExpenses = await Expense.countDocuments({ user: req.user._id });
        const pendingExpenses = await Expense.countDocuments({ user: req.user._id, status: 'pending' });
        const approvedExpenses = await Expense.countDocuments({ user: req.user._id, status: 'approved' });

        const totalAmountAgg = await Expense.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.render('dashboard/employee', {
            title: 'Employee Dashboard',
            currentUser: req.user,
            currentPage: 'dashboard', // for sidebar active link
            company,
            myExpenses,
            stats: {
                totalExpenses,
                pendingExpenses,
                approvedExpenses,
                totalAmount: totalAmountAgg[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Employee dashboard error:', error);
        req.flash('error_msg', 'Error loading employee dashboard');
        res.redirect('/auth/login');
    }
}
