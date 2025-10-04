const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
            .populate('company');
        
        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
            .populate('company')
            .populate('manager', 'firstName lastName email');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;