const Company = require('../models/Company');
const User = require('../models/User');

// GET /company/settings - Show company settings page
exports.getSettings = async (req, res) => {
    try {
        const company = await Company.findById(req.user.company)
            .populate('adminUser', 'firstName lastName email');

        if (!company) {
            req.flash('error_msg', 'Company not found');
            return res.redirect('/dashboard');
        }

        res.render('company/settings', {
            title: 'Company Settings',
            company,
            user: req.user
        });
    } catch (error) {
        console.error('Get company settings error:', error);
        req.flash('error_msg', 'Error loading company settings');
        res.redirect('/dashboard');
    }
};

// POST /company/settings - Update company settings
exports.postSettings = async (req, res) => {
    try {
        const { name, email, phone, address, website } = req.body;

        const company = await Company.findById(req.user.company);

        if (!company) {
            req.flash('error_msg', 'Company not found');
            return res.redirect('/dashboard');
        }

        // Update company details
        company.name = name || company.name;
        company.email = email || company.email;
        company.phone = phone || company.phone;
        company.address = address || company.address;
        company.website = website || company.website;

        await company.save();

        req.flash('success_msg', 'Company settings updated successfully');
        res.redirect('/company/settings');
    } catch (error) {
        console.error('Update company settings error:', error);
        req.flash('error_msg', 'Error updating company settings');
        res.redirect('/company/settings');
    }
};

// GET /company/currency - Show currency settings page
exports.getCurrency = async (req, res) => {
    try {
        const company = await Company.findById(req.user.company);

        if (!company) {
            req.flash('error_msg', 'Company not found');
            return res.redirect('/dashboard');
        }

        // List of common currencies
        const currencies = [
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
            { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
            { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
            { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
            { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
            { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
            { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' }
        ];

        res.render('company/currency', {
            title: 'Currency Settings',
            company,
            currencies,
            user: req.user
        });
    } catch (error) {
        console.error('Get currency settings error:', error);
        req.flash('error_msg', 'Error loading currency settings');
        res.redirect('/dashboard');
    }
};

// POST /company/currency - Update currency settings
exports.postCurrency = async (req, res) => {
    try {
        const { baseCurrency, allowMultipleCurrencies } = req.body;

        const company = await Company.findById(req.user.company);

        if (!company) {
            req.flash('error_msg', 'Company not found');
            return res.redirect('/dashboard');
        }

        // Update currency settings
        if (baseCurrency) {
            company.settings.baseCurrency = baseCurrency;
        }
        
        company.settings.allowMultipleCurrencies = allowMultipleCurrencies === 'true' || allowMultipleCurrencies === true;

        await company.save();

        req.flash('success_msg', 'Currency settings updated successfully');
        res.redirect('/company/currency');
    } catch (error) {
        console.error('Update currency settings error:', error);
        req.flash('error_msg', 'Error updating currency settings');
        res.redirect('/company/currency');
    }
};

// GET /company/users - Get all users in company (API endpoint)
exports.getCompanyUsers = async (req, res) => {
    try {
        const users = await User.find({ company: req.user.company })
            .select('firstName lastName email role department isActive')
            .sort({ firstName: 1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get company users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company users'
        });
    }
};

// GET /company/stats - Get company statistics (API endpoint)
exports.getCompanyStats = async (req, res) => {
    try {
        const company = await Company.findById(req.user.company);
        const totalUsers = await User.countDocuments({ company: req.user.company });
        const activeUsers = await User.countDocuments({ company: req.user.company, isActive: true });

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                baseCurrency: company.settings.baseCurrency,
                allowMultipleCurrencies: company.settings.allowMultipleCurrencies
            }
        });
    } catch (error) {
        console.error('Get company stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company statistics'
        });
    }
};