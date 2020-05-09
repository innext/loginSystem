var createError = require('http-errors');
var express = require('express');
var path = require('path');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bcrypt = require('bcrypt');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebook = require('passport-facebook');
var google = require('passport-google');
var twitter = require('passport-twitter');
var linkedin = require('passport-linkedin');
var bodyParser = require('body-parser');
var User = require('../routes/models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Still working on it..:-(, wait, i want to make sure registration and login are good to go first');
}); // end of GET / or Home page

// GET /register page then render register.pug
router.get('/register', function(req, res, next) {
  res.render('register', {
    'title' : 'Register'
  });
}); // end of GET /register

// start of POST /register
// this is to get the input from the register page and post to DB
// but to do this I need to input each value in a var of their own to call when to add to DB
router.post('/register', function(req, res, next) {
  // start of validation of input before posting to MongoDB
  // this is to take all field input and put them in a container called by their names
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;
  console.log(`${name}, ${email}, ${username}, ${password}`);
  var profileImageName = req.file.originalname;
  var profileImageMime = req.file.mimetype;
  var profileImagePath = req.file.path;
  var profileImageext = req.file.extension;
  var profileImageSize = req.file.size;
  // this to check if this is working
  console.log(`${profileImageName}, ${profileImageMime}, ${profileImagePath}, ${profileImageext}, ${profileImageSize}`);
  // This is to check the image file and give it my own name and other ppt.
  if(!req.file) {
    var profileImageName = 'noimage.png';
    console.log(`${profileImageName}`);
   }
   // end of input field into containers

  // this is the real validation step of the input and check length, not empty password match
  check('name', 'Name is required').not().isEmpty().isAlphaLocales().isLength({min: 4, max: 30});
  check('email', 'Email is required').not().isEmpty().isLength({min: 11, max: 35});
  // this is to check if its an email
  check('email', 'Email not valid').isEmail();
  check('username', 'Username is required').not().isEmpty().isAlpha().isAlphanumericLocales().isLength({min:3, max:14});
  check('password', 'Password is required').not().isEmpty().isLength({min:10, max: 35});
  // to check if password match with password2
  check('password2', 'Password do not match, please check').equals(req.body.password);
  check('profileImage', 'Profile Image is required').not().isEmpty();
  // end of the real validation

// check for errors during the validation
  const errors = validationResult(req);
  if(!errors.isEmpty()){ // if there was error during validation return to registration page and help fill the input back with the users input
    return res.render('register').json({
      errors: errors.array(),
      // to return all input value back to the user if there was error during filling
      name: name,
      email: email,
      username: username,
    }); // end of error check, if no errors then create new user
  } 
  else {
    // start of the creation of newUser with the information i got before
    var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      profileimage: profileImageName
    });
    console.log(`${newUser}`);
    // because we dont want to save password like that and we want to hash it we then call 
    // createUser in our User model that would do the hashing for us replace the password field with the hashed
    // then calls on the .save to save to our MongoDB
    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });
    // end of creation of new user
    // sucess message to tell the user, user was created
    req.flash('success', 'You now registered, may login ;)' );
    //after the message the page will be redirected to home page
    res.location('/');
    res.redirect('/'); // to get to home page / you need to be logged in so it redirect to login
  } //end of if else
}); // end of post /register


// GET /login page then render login.pug
router.get('/login', function(req, res, next) {
  res.render('login', {
    'title' : 'Login'
  });
}); // end of GET /login

// POST /login req then
// use passport to authentictae the user after getting the user from the DB
// and if the user is not found in DB or it failed maybe because incorrect PW send Invalid username or password
router.post('/login', passport.authenticate('local', {failureRedirect:'/users/login', failureFlash:'Invalid username or password'}), function(req, res){
  console.log('Authentication Successful');
  req.flash('success', 'You are logged in');
  res.redirect('/');
}); //end of POST /login

// this is to use passport to connect to DB to check Users id
passport.serializeUser(function(User, done){
  done(null, User.id);
});

passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// for login check on local DB
passport.use(new localStrategy(
  function(username, password, done){
    User.getUserByUsername(username, function(err, User){
      if(err) throw err;
      if(!User){
        console.log('Unknow User');
        return done(null, false,{message: 'Unknown User'});
      }

      // this is to compare password sent by user and that in the DB
      User.comparePassword(password,User.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          console.log('Invalid Password');
          return done(null, false, {message:'Invalid Password'});
        }
      });

    });
  }
));

// this is to get router to the logout function and redirect to login page
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success','You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
