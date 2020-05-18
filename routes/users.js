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
      console.log(`${password}`);
      console.log(user.password);
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
  //passport.authenticate is telling passport to authenticate the user locally and err msg and redirect if was unable to authenticate user
  console.log('Authentication Successful');
  req.flash('success', 'You are logged in');
  res.redirect('/');
}); //end of POST /login

// this is to authenticate the user from POST req of /login, it takes 
// its username and finds in DB if find then picks password and compare with that of DB
// else tells unknow user if not found and invalid password if password != DB password
passport.use(new localStrategy( // localStrategy is what we using to check user in later we use facebook, twitter, linkedin
  function(username, password, done){
    User.getUserByUsername(username, function(err, user){ // username here is the one that getUserByUsername fn got us from its query of DB
      if(err) {return done(err);}
      if(!user){
        console.log('Unknow User');
        return done(null, false,{message: 'Unknown User'}); // null means no err and false means no username found
      }
      
      // this is to compare password sent by user and that in the DB
      User.comparePassword(password, user.password, function(err, isMatch){
        console.log(password);
        console.log(username);
        console.log(user.password);
        console.log(user.username);
        // if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          console.log('Invalid Password');
          return done(null, false, {message:'Invalid Password'}); // null means no err and false means no password=DBpassword for that user found
        }
      });

    }); // end of getUserByUsername
  } // currently now am using different error to know if getUserByUsername is working and comparePassword for debugging but would use same err later
)); // end of user authenticatation 

// this is to use passport keep user in session connected to DB using Users id
passport.serializeUser(function(User, done){
  done(null, User._id);
});

passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// this is to get router to the logout function and redirect to login page
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success','You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
