const User = require('../models/User');
const Expense = require('../models/Expense');
const Company = require('../models/Company');

// GET /dashboard - Show dashboard based on user role
exports.getDashboard = async (req, res) => {
    try {
        const user = req.user;
        
        // Get dashboard data based on role
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

// Admin Dashboard
async function renderAdminDashboard(req, res) {
    try {
        const company = await Company.findById(req.user.company);
        
        // Get statistics
        const totalUsers = await User.countDocuments({ company: req.user.company });
        const activeUsers = await User.countDocuments({ company: req.user.company, isActive: true });
        
        const totalExpenses = await Expense.countDocuments({ company: req.user.company });
        const pendingExpenses = await Expense.countDocuments({ 
            company: req.user.company, 
            status: 'pending' 
        });
        const approvedExpenses = await Expense.countDocuments({ 
            company: req.user.company, 
            status: 'approved' 
        });
        
        // Calculate total amounts
        const totalAmount = await Expense.aggregate([
            { $match: { company: req.user.company } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const pendingAmount = await Expense.aggregate([
            { $match: { company: req.user.company, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Get recent expenses
        const recentExpenses = await Expense.find({ company: req.user.company })
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.render('dashboard/admin', {
            title: 'Admin Dashboard',
            user: req.user,
            company,
            stats: {
                totalUsers,
                activeUsers,
                totalExpenses,
                pendingExpenses,
                approvedExpenses,
                totalAmount: totalAmount[0]?.total || 0,
                pendingAmount: pendingAmount[0]?.total || 0
            },
            recentExpenses
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        throw error;
    }
}

// Manager Dashboard
async function renderManagerDashboard(req, res) {
    try {
        const company = await Company.findById(req.user.company);
        
        // Get pending expenses for approval
        const pendingExpenses = await Expense.find({
            company: req.user.company,
            status: 'pending'
        })
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);
        
        // Get team statistics
        const teamExpenses = await Expense.countDocuments({ company: req.user.company });
        const pendingCount = await Expense.countDocuments({ 
            company: req.user.company, 
            status: 'pending' 
        });
        
        res.render('dashboard/manager', {
            title: 'Manager Dashboard',
            user: req.user,
            company,
            pendingExpenses,
            stats: {
                teamExpenses,
                pendingCount
            }
        });
    } catch (error) {
        console.error('Manager dashboard error:', error);
        throw error;
    }
}

// Employee Dashboard
async function renderEmployeeDashboard(req, res) {
    try {
        const company = await Company.findById(req.user.company);
        
        // Get user's expenses
        const myExpenses = await Expense.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Get user's expense statistics
        const totalExpenses = await Expense.countDocuments({ user: req.user._id });
        const pendingExpenses = await Expense.countDocuments({ 
            user: req.user._id, 
            status: 'pending' 
        });
        const approvedExpenses = await Expense.countDocuments({ 
            user: req.user._id, 
            status: 'approved' 
        });
        
        const totalAmount = await Expense.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        res.render('dashboard/employee', {
            title: 'My Dashboard',
            user: req.user,
            company,
            myExpenses,
            stats: {
                totalExpenses,
                pendingExpenses,
                approvedExpenses,
                totalAmount: totalAmount[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Employee dashboard error:', error);
        throw error;
    }
}