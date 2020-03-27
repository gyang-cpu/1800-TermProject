const mongoose = require("mongoose");
const passportMongoose = require("passport-local-mongoose");

//validates that no duplicate sign ups // 
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');



var UserSchema = new mongoose.Schema({
    username: {type: String, required: [true, "username cannot be blank"]}
    
});

UserSchema.plugin(uniqueValidator, {message:'please choose another username this is already taken'});

//// -------> we can probably insert this as a method inside of userSchema
/// store the password as an attribute in the schema //  
UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

//-->Function to validate the hashed passwords stored in Mongo
UserSchema.methods.validatePassword = function(password){
    let hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash
}

//--> generates a JWT token for session control. 
// exp.setdate sets the length of time user will be kicked off the session
UserSchema.methods.generateJWT = function() {
      let today = new Date();
      let exp = new Date(today);
      exp.setDate(today.getDate() + 30);
    
      return jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000),
      }, secret);
    };
    
//---> 
UserSchema.methods.toAuthJSON = function(){
      return {
        username: this.username,
        token: this.generateJWT(),
        
        };
};
    

UserSchema.plugin(passportMongoose);

module.exports = mongoose.model("User", UserSchema);