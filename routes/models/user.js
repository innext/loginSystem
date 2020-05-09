var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// this is to connect to the DB on my localhost
 // nodeJSWorks is the name of my DB on my localhost
mongoose.connect('MongoDB://localhost/nodeJSWorks');

var db = mongoose.connection;

// User Schema (this is the definition of the input the DB will take more like stating the head of table)
var UserSchema = mongoose.Schema({
    username : {
        type: String,
        index: true,
        require: true
    },
    password : {
        type: String, require: true, bcrypt: true
    },
    email : {
        type: String,
        require: true
    },
    name : {
        type: String,
        require: true
    },
    profileimage : {
        type: String,
        require: true
    }
});

// this to get the candidates Password then hash it and check if it match
var User = mongoose.model('User', UserSchema);
module.exports = mongoose.model('User', UserSchema);

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch){
        if(err) return callback(err);
        callback(null, isMatch);
    });
};

// this is to find user by id
module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
};

// this is to find the username in the DB 
module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);
};

// this is to create user and hash the password for the new user
module.exports.createUser = function(newUser, callback){
        bcrypt.hash(newUser.password, 15, function(err, hash){
            if(err) throw err;
            // set hashed password
            newUser.password = hash;
            // create User
            newUser.save(callback);
        });
};

