const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      // select('+password') is required because password is omitted by default
      const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
      if (!user) return done(null, false, { message: 'Incorrect email or password' });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return done(null, false, { message: 'Incorrect email or password' });

      // optionally check user.isActive
      if (!user.isActive) return done(null, false, { message: 'Account is inactive' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      // don't include password in deserialized user
      const user = await User.findById(id).populate('company manager');
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
