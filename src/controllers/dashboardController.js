const User = require('../models/User');
const Expense = require('../models/Expense');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalFlow');

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
        // Get basic company info
        const company = await Company.findById(req.user.company);

        // Get users and managers
        const [users, managers] = await Promise.all([
            User.find({ company: req.user.company })
                .select('firstName lastName email role department'),
            User.find({ 
                company: req.user.company, 
                role: 'manager' 
            }).select('firstName lastName email department')
        ]);

        // Get expense statistics
        const [totalExpenses, pendingExpenses, recentExpenses] = await Promise.all([
            Expense.countDocuments({ company: req.user.company }),
            Expense.countDocuments({ 
                company: req.user.company, 
                status: 'pending' 
            }),
            Expense.find({ company: req.user.company })
                .populate('user', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        // Calculate total and monthly amounts
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        const [totalAmount, monthlyAmount] = await Promise.all([
            Expense.aggregate([
                { 
                    $match: { 
                        company: req.user.company._id,
                        status: 'approved'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            Expense.aggregate([
                {
                    $match: {
                        company: req.user.company._id,
                        status: 'approved',
                        createdAt: {
                            $gte: new Date(currentYear, currentMonth, 1),
                            $lt: new Date(currentYear, currentMonth + 1, 1)
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        // Get chart data
        const categoryData = await Expense.aggregate([
            {
                $match: {
                    company: req.user.company._id,
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const monthlyData = await Expense.aggregate([
            {
                $match: {
                    company: req.user.company._id,
                    status: 'approved',
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get approval rules
        const approvalRules = await ApprovalRule.find({ 
            company: req.user.company 
        });

        // Format chart data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyAmounts = Array(12).fill(0);
        monthlyData.forEach(data => {
            monthlyAmounts[data._id - 1] = data.total;
        });

        const categories = categoryData.map(cat => cat._id);
        const categoryAmounts = categoryData.map(cat => cat.total);

        // Render dashboard with all data
        res.render('dashboard/admin', {
            title: 'Admin Dashboard',
            user: {
                name: req.user.firstName + ' ' + req.user.lastName,
                _id: req.user._id,
                role: req.user.role
            },
            company: {
                name: company.name,
                currency: company.currency
            },
            stats: {
                totalEmployees: users.length,
                pendingExpenses,
                totalAmount: totalAmount[0]?.total || 0,
                monthlyAmount: monthlyAmount[0]?.total || 0
            },
            users,
            managers,
            expenses: recentExpenses,
            recentExpenses,
            approvalRules,
            chartData: {
                categories,
                categoryAmounts,
                months,
                monthlyAmounts
            }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('error_msg', 'Error loading dashboard');
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
