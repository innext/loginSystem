var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// this is to connect to the DB on my localhost
 // nodeJSWorks is the name of my DB on my localhost
mongoose.connect(process.env.DB_URL || 'MongoDB://localhost/nodeJSWorks');

var db = mongoose.connection;

// User Schema (this is the definition of the input the DB will take more like stating the head of table)
var UserSchema = mongoose.Schema({
    username : {
        type: String,
        index: {unique: true},
        trim: true,
        require: true
    },
    password : {
        type: String, require: true, bcrypt: true
    },
    email : {
        type: String,
        require: true,
        trim: true,
        index: {unique: true}
    },
    name : {
        type: String,
        trim: true,
        require: true
    },
    ipAddress : {
        type: Object,
        require: true
    },
    admin: Boolean,
    active: Boolean
});

// this is to convert this UserSchema in a usable model called User
var User = mongoose.model('User', UserSchema);
module.exports = mongoose.model('User', UserSchema); // then this export the model User so it can be used outside this file.

// this is to save user and hash the password for the new user created in the users.js file
module.exports.createUser = function(newUser, callback){
        bcrypt.hash(newUser.password, 15, function(err, hash){ // this is to call the newUser's password and hash it with 15 saltrounds
            if(err) throw err;
            // set hashed password
            newUser.password = hash; // this is to replace the password of the newUser and replace with the hashed one
            // create User or save the user to MongoDB
            newUser.save(callback);
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

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch){
        if(err) return callback(err);
        callback(null, isMatch);
    });
};