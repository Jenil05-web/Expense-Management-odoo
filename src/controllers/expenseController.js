const Expense = require('../models/Expense');

// GET /expenses - List expenses
exports.getExpenses = async (req, res) => {
    try {
        const query = { company: req.user.company };
        
        if (req.user.role === 'employee') {
            query.user = req.user._id;
        }

        const expenses = await Expense.find(query)
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.render('expenses/index', {
            title: 'Expenses',
            expenses,
            user: req.user
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        req.flash('error_msg', 'Error loading expenses');
        res.redirect('/dashboard');
    }
};

exports.getCreateExpense = (req, res) => {
    res.render('expenses/create', {
        title: 'Create Expense',
        user: req.user
    });
};

exports.postCreateExpense = async (req, res) => {
    try {
        const { category, amount, currency, date, description, merchant } = req.body;

        const newExpense = new Expense({
            user: req.user._id,
            company: req.user.company,
            category,
            amount: parseFloat(amount),
            currency: currency || 'USD',
            date: date || new Date(),
            description,
            merchant,
            status: 'draft'
        });

        await newExpense.save();
        req.flash('success_msg', 'Expense created successfully');
        res.redirect('/expenses');
    } catch (error) {
        console.error('Create expense error:', error);
        req.flash('error_msg', 'Error creating expense');
        res.redirect('/expenses/create');
    }
};

exports.getExpenseDetails = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('company', 'name');

        if (!expense || expense.company._id.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/expenses');
        }

        res.render('expenses/view', {
            title: 'Expense Details',
            expense,
            user: req.user
        });
    } catch (error) {
        console.error('Get expense details error:', error);
        req.flash('error_msg', 'Error loading expense');
        res.redirect('/expenses');
    }
};

exports.getEditExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/expenses');
        }

        if (expense.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error_msg', 'You can only edit your own expenses');
            return res.redirect('/expenses');
        }

        res.render('expenses/edit', {
            title: 'Edit Expense',
            expense,
            user: req.user
        });
    } catch (error) {
        console.error('Get edit expense error:', error);
        req.flash('error_msg', 'Error loading expense');
        res.redirect('/expenses');
    }
};

exports.postEditExpense = async (req, res) => {
    try {
        const { category, amount, currency, date, description, merchant } = req.body;
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/expenses');
        }

        if (expense.status !== 'draft' && expense.status !== 'rejected') {
            req.flash('error_msg', 'Cannot edit expense in current status');
            return res.redirect('/expenses');
        }

        expense.category = category;
        expense.amount = parseFloat(amount);
        expense.currency = currency;
        expense.date = date;
        expense.description = description;
        expense.merchant = merchant;

        await expense.save();
        req.flash('success_msg', 'Expense updated successfully');
        res.redirect('/expenses');
    } catch (error) {
        console.error('Update expense error:', error);
        req.flash('error_msg', 'Error updating expense');
        res.redirect('/expenses');
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/expenses');
        }

        if (expense.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error_msg', 'You can only delete your own expenses');
            return res.redirect('/expenses');
        }

        await Expense.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Expense deleted successfully');
        res.redirect('/expenses');
    } catch (error) {
        console.error('Delete expense error:', error);
        req.flash('error_msg', 'Error deleting expense');
        res.redirect('/expenses');
    }
};

exports.getExpenseHistory = async (req, res) => {
    try {
        const query = { company: req.user.company, user: req.user._id };
        const expenses = await Expense.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.render('expenses/history', {
            title: 'Expense History',
            expenses,
            user: req.user
        });
    } catch (error) {
        console.error('Get expense history error:', error);
        req.flash('error_msg', 'Error loading expense history');
        res.redirect('/expenses');
    }
};

exports.submitExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'Expense not found');
            return res.redirect('/expenses');
        }

        if (expense.status !== 'draft') {
            req.flash('error_msg', 'Expense already submitted');
            return res.redirect('/expenses');
        }

        expense.status = 'pending';
        expense.submittedAt = new Date();
        await expense.save();
        req.flash('success_msg', 'Expense submitted for approval');
        res.redirect('/expenses');
    } catch (error) {
        console.error('Submit expense error:', error);
        req.flash('error_msg', 'Error submitting expense');
        res.redirect('/expenses');
    }
};