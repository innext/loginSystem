var createError = require('http-errors');
var express = require('express');
var path = require('path');
const {check, validationResult} = require('express-validator');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bcrypt = require('bcrypt');
var session = require('express-session');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebook = require('passport-facebook');
var google = require('passport-google');
var twitter = require('passport-twitter');
var linkedin = require('passport-linkedin');
var bodyParser = require('body-parser');
var multer = require('multer');
var flash = require('connect-flash');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var db = mongoose.connection;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
// i want to see to changing the view engine for jade to "pug" or any other one 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Handle File Upload
// multer helps to do file upload and it will send to destination file named upload

app.use(multer({
  dest:'uploads/'
}).single('profileImage'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('serve-static')(__dirname + '/../../public'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
// Handle Express Sessions
app.use(require('express-session')({
  secret: 'mysecret', // this is wrong, it should be in a file and make req to the file and when pushing to github should not be pushed along e.g "var secret = require('./config/secret');"
  saveUninitialized: true,
  resave: true
}));
// pasport
app.use(passport.initialize());
app.use(passport.session());
// validator
app.use(require('express-validator')({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.');
    var root = namespace.shift();
    var formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg : msg,
      value: value
    };
  }
}));
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.message = require('express-message')(req, res);
  next();
});

// this is to get all router and check if user is logged in
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.listen(2000, function(){
  console.log("server running on port 2000");
});