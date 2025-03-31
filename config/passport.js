const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { knex } = require('../app');

module.exports = function(passport) {
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await knex('users').where({ email }).first();
        if (!user) {
          return done(null, false, { message: 'No user with that email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Password incorrect' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await knex('users').where({ id }).first();
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};