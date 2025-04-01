module.exports = {
  ensureAuthenticated: function(req, res, next) {
    console.log('Checking authentication - Session:', req.session);
    console.log('Authenticated:', req.isAuthenticated(), 'User:', req.user);
    if (req.isAuthenticated()) {
      return next();
    }
    console.log('Not authenticated, redirecting to /login');
    res.redirect('/login');
  }
};