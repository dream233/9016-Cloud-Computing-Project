const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const knex = require('../db');

module.exports = function(passport) {
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        console.log('Attempting to authenticate user with email:', email);
        const user = await knex('users').where({ email }).first();
        if (!user) {
          console.log('No user found with email:', email);
          return done(null, false, { message: 'No user with that email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          console.log('Password incorrect for email:', email);
          return done(null, false, { message: 'Password incorrect' });
        }
        console.log('User authenticated successfully:', email);
        return done(null, user);
      } catch (err) {
        console.error('Error during authentication:', err);
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    console.log('Serializing user with ID:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      console.log('Deserializing user with ID:', id);
      const user = await knex('users').where({ id }).first();
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      console.log('Deserialized user:', user.email);
      done(null, user);
    } catch (err) {
      console.error('Error during deserialization:', err);
      done(err);
    }
  });
};