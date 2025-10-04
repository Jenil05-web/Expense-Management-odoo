const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ company: req.user.company })
            .populate('company', 'name')
            .sort({ createdAt: -1 });

        res.render('users/index', {
            title: 'User Management',
            users,
            user: req.user
        });
    } catch (error) {
        console.error('Get users error:', error);
        req.flash('error_msg', 'Error loading users');
        res.redirect('/dashboard');
    }
};

exports.getCreateUser = (req, res) => {
    res.render('users/create', {
        title: 'Create User',
        user: req.user
    });
};

exports.postCreateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, department, position } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            req.flash('error_msg', 'User with this email already exists');
            return res.redirect('/users/create');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'employee',
            department,
            position,
            company: req.user.company,
            isActive: true
        });

        await newUser.save();
        req.flash('success_msg', 'User created successfully');
        res.redirect('/users');
    } catch (error) {
        console.error('Create user error:', error);
        req.flash('error_msg', 'Error creating user');
        res.redirect('/users/create');
    }
};

exports.getEditUser = async (req, res) => {
    try {
        const editUser = await User.findById(req.params.id);
        
        if (!editUser || editUser.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users');
        }

        res.render('users/edit', {
            title: 'Edit User',
            editUser,
            user: req.user
        });
    } catch (error) {
        console.error('Get edit user error:', error);
        req.flash('error_msg', 'Error loading user');
        res.redirect('/users');
    }
};

exports.postEditUser = async (req, res) => {
    try {
        const { firstName, lastName, role, department, position } = req.body;
        const editUser = await User.findById(req.params.id);
        
        if (!editUser || editUser.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users');
        }

        editUser.firstName = firstName;
        editUser.lastName = lastName;
        editUser.role = role;
        editUser.department = department;
        editUser.position = position;

        await editUser.save();
        req.flash('success_msg', 'User updated successfully');
        res.redirect('/users');
    } catch (error) {
        console.error('Update user error:', error);
        req.flash('error_msg', 'Error updating user');
        res.redirect('/users');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        
        if (!userToDelete || userToDelete.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users');
        }

        if (userToDelete._id.toString() === req.user._id.toString()) {
            req.flash('error_msg', 'You cannot delete yourself');
            return res.redirect('/users');
        }

        await User.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'User deleted successfully');
        res.redirect('/users');
    } catch (error) {
        console.error('Delete user error:', error);
        req.flash('error_msg', 'Error deleting user');
        res.redirect('/users');
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const profileUser = await User.findById(req.params.id)
            .populate('company', 'name email');
        
        if (!profileUser || profileUser.company._id.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users');
        }

        res.render('users/profile', {
            title: 'User Profile',
            profileUser,
            user: req.user
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/users');
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const userToToggle = await User.findById(req.params.id);
        
        if (!userToToggle || userToToggle.company.toString() !== req.user.company.toString()) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/users');
        }

        userToToggle.isActive = !userToToggle.isActive;
        await userToToggle.save();
        req.flash('success_msg', `User ${userToToggle.isActive ? 'activated' : 'deactivated'} successfully`);
        res.redirect('/users');
    } catch (error) {
        console.error('Toggle user status error:', error);
        req.flash('error_msg', 'Error updating user status');
        res.redirect('/users');
    }
};