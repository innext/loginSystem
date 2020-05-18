var express = require('express');
var router = express.Router();


// Member page
router.get('/', ensureAuthenticated, function(req, res, next) {
  res.render('index', { title: 'Members' });
});
// this is to check if the is a user in session before taking them to the members page, if there is none redirect them back to login page.
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/users/login');
}
 module.exports = router;