const express = require('express'),
    bodyParser = require("body-parser"),
    mongoose = require('mongoose'),
    User = require("./models/user"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportMongoose = require("passport-local-mongoose");


const app = express()


// Database Mongoose
// ============================

const mongooseUsername = "edgar-admin"
const mongoosePassword = "test1234"
mongoose.connect(`mongodb+srv://${mongooseUsername}:${mongoosePassword}@cluster0-sftgr.mongodb.net/todolistDB`,
    { useNewUrlParser: true, useUnifiedTopology: true })

app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// Sessions
// =========================

app.use(require("express-session")({
    secret: "Login test for comp-1800",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

// passport initalization 
// ======================

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ROUTES
// ===============================


app.get("/secret", isLoggedIn, function (req, res) {
    res.render("secret");
});

// Login Routes
// ===============================

app.get("/", function (req, res) {
    res.render("home");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/signup"
}), function (req, res) {

})


// Sign up Route
// ===============================

app.get("/signup", function (req, res) {
    res.render("signup")
})

app.post("/signup", function (req, res) {
    req.body.username
    req.body.password

    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render('signup');
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect("/secret")
        });
    });
});

// Logout Routes
// ======================================

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/")
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/")
}

app.listen(3000, function () {
    console.log("Server has started")
});