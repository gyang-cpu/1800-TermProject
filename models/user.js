const mongoose = require("mongoose");
const passportMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

UserSchema.plugiyyn(passportMongoose);

module.exports = mongoose.model("User", UserSchema);