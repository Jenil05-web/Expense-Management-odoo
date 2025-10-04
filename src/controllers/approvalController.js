const Expense = require('../models/Expense');
const ApprovalRequest = require('../models/ApprovalRequest');

exports.getPendingApprovals = async (req, res) => {
    try {
        const expenses = await Expense.find({
            company: req.user.company,
            status: 'pending'
        })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });

        res.render('approvals/pending', {
            title: 'Pending Approvals',
            expenses,
            user: req.user
        });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        req.flash('error_msg', 'Error loading approvals');
        res.redirect('/dashboard');
    }
};

exports.getReviewApproval = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('user', 'firstName lastName email department');

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/approvals/pending');
        }

        res.render('approvals/review', {
            title: 'Review Expense',
            expense,
            user: req.user
        });
    } catch (error) {
        console.error('Get review approval error:', error);
        req.flash('error_msg', 'Error loading expense');
        res.redirect('/approvals/pending');
    }
};

exports.approveExpense = async (req, res) => {
    try {
        const { comments } = req.body;
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/approvals/pending');
        }

        expense.status = 'approved';
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();
        expense.approvalComments = comments;

        await expense.save();
        req.flash('success_msg', 'Expense approved successfully');
        res.redirect('/approvals/pending');
    } catch (error) {
        console.error('Approve expense error:', error);
        req.flash('error_msg', 'Error approving expense');
        res.redirect('/approvals/pending');
    }
};

exports.rejectExpense = async (req, res) => {
    try {
        const { comments } = req.body;
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/approvals/pending');
        }

        expense.status = 'rejected';
        expense.rejectedBy = req.user._id;
        expense.rejectedAt = new Date();
        expense.rejectionReason = comments;

        await expense.save();
        req.flash('success_msg', 'Expense rejected');
        res.redirect('/approvals/pending');
    } catch (error) {
        console.error('Reject expense error:', error);
        req.flash('error_msg', 'Error rejecting expense');
        res.redirect('/approvals/pending');
    }
};

exports.getFlowSetup = (req, res) => {
    res.render('approvals/flow-setup', {
        title: 'Approval Flow Setup',
        user: req.user
    });
};

exports.postFlowSetup = async (req, res) => {
    try {
        req.flash('success_msg', 'Approval flow saved successfully');
        res.redirect('/approvals/flow-setup');
    } catch (error) {
        console.error('Save approval flow error:', error);
        req.flash('error_msg', 'Error saving approval flow');
        res.redirect('/approvals/flow-setup');
    }
};

exports.getRules = (req, res) => {
    res.render('approvals/rules', {
        title: 'Approval Rules',
        user: req.user
    });
};