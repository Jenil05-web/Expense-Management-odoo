const express = require('express');
const router = express.Router();

// Middleware to check if user is a manager
function isManager(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'manager') {
        next();
    } else {
        res.redirect('/login');
    }
}

// Manager Dashboard Route
router.get('/', isManager, async (req, res) => {
    try {
        const managerId = req.session.user._id;
        
        // Fetch pending expenses for this manager's team
        const pendingExpenses = await Expense.find({
            'employee.manager': managerId,
            status: 'pending'
        }).populate('employee');

        // Calculate stats
        const stats = {
            pending: await Expense.countDocuments({
                'employee.manager': managerId,
                status: 'pending'
            }),
            approved: await Expense.countDocuments({
                'employee.manager': managerId,
                status: 'approved'
            }),
            rejected: await Expense.countDocuments({
                'employee.manager': managerId,
                status: 'rejected'
            }),
            teamSize: await User.countDocuments({
                manager: managerId
            })
        };

        res.render('manager', {
            user: req.session.user,
            company: req.session.company || { name: 'Company', currency: 'USD' },
            pendingExpenses,
            stats,
            pendingCount: stats.pending
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Get expenses by status
router.get('/expenses', isManager, async (req, res) => {
    try {
        const managerId = req.session.user._id;
        const status = req.query.status || 'pending';
        
        const expenses = await Expense.find({
            'employee.manager': managerId,
            status: status
        }).populate('employee');

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get specific expense details
router.get('/expenses/:id', isManager, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('employee')
            .populate('approvalHistory.approver');
        
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve expense
router.post('/expenses/:id/approved', isManager, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        
        expense.status = 'approved';
        expense.approvedDate = new Date();
        expense.approvalHistory.push({
            approver: req.session.user._id,
            status: 'approved',
            comments: req.body.comments,
            date: new Date()
        });
        
        await expense.save();
        res.json({ message: 'Expense approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reject expense
router.post('/expenses/:id/rejected', isManager, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        
        expense.status = 'rejected';
        expense.rejectedDate = new Date();
        expense.approvalHistory.push({
            approver: req.session.user._id,
            status: 'rejected',
            comments: req.body.comments,
            date: new Date()
        });
        
        await expense.save();
        res.json({ message: 'Expense rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get team members
router.get('/team', isManager, async (req, res) => {
    try {
        const managerId = req.session.user._id;
        const teamMembers = await User.find({ manager: managerId });
        
        // Add stats for each team member
        const membersWithStats = await Promise.all(teamMembers.map(async (member) => {
            const stats = {
                total: await Expense.countDocuments({ employee: member._id }),
                pending: await Expense.countDocuments({ employee: member._id, status: 'pending' }),
                approved: await Expense.countDocuments({ employee: member._id, status: 'approved' }),
                rejected: await Expense.countDocuments({ employee: member._id, status: 'rejected' })
            };
            return { ...member.toObject(), stats };
        }));
        
        res.json(membersWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get reports data
router.get('/reports', isManager, async (req, res) => {
    try {
        const managerId = req.session.user._id;
        
        // Get team expenses grouped by member
        const teamMembers = await User.find({ manager: managerId });
        const teamData = await Promise.all(teamMembers.map(async (member) => {
            const total = await Expense.aggregate([
                { $match: { employee: member._id, status: 'approved' } },
                { $group: { _id: null, total: { $sum: '$amountInCompanyCurrency' } } }
            ]);
            return {
                name: member.name,
                amount: total[0]?.total || 0
            };
        }));

        res.json({
            teamMembers: teamData.map(t => t.name),
            teamExpenses: teamData.map(t => t.amount),
            categories: ['Food', 'Travel', 'Accommodation', 'Supplies', 'Other'],
            categoryAmounts: [5000, 12000, 8000, 3000, 2000] // Calculate from actual data
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;