const express = require('express'),
    bodyParser = require("body-parser"),
    mongoose = require('mongoose'),
    // User = require("./models/user"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportMongoose = require("passport-local-mongoose");


const app = express()


// Database Mongoose
// ============================

// const mongooseUsername = "edgar-admin"
// const mongoosePassword = "test1234"
// mongoose.connect(`mongodb+srv://${mongooseUsername}:${mongoosePassword}@cluster0-sftgr.mongodb.net/todolistDB`,
    // { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect("mongodb://localhost:27017/1800todolist", {useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false})

// MONGOOSE SCHEMAS

const listSchema = new mongoose.Schema({
    name: String,
    date: Date,
    tags: {
        type: Array,
        "default": ['tag1', 'tag2']
    },
    items: {
        type: Array,
        "default": ['item1', 'item2']
    }
});
const List = mongoose.model('List', listSchema);

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    lists: [listSchema]
});
userSchema.plugin(passportMongoose);
const User = mongoose.model("User", userSchema);

const defaultList1 = new List({
    name: "Welcome to Memento!",
    date: Date.now()
});
const defaultList2 = new List({
    name: "This is your first sample List :)",
    date: Date.now()
})
const defaultLists = [defaultList1, defaultList2]


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
app.get("/", checkAuthenticated, function (req, res) {
    // console.log(req.user.lists)
    res.render("secret", {
        newListItems: req.user.lists,
        user: req.user
    });
    const newList = new List({
        name: "Sample List",
        date: Date.now()
    });
});

app.post('/', checkAuthenticated, (req, res) => {
    console.log(req.body);
    const newList = {
        name: req.body.listTitle,
        date: req.body.listDate
    }
    console.log(newList)
    User.findById(req.body.userId, (err, user) => {
        if (err) { console.log(err) }
        else {
            console.log(user)
            user.lists.push(newList)
            user.save()
        }
        res.redirect('/');
    })
})
// { $pullAll: { lists: [ _id: req.body.listId ]}}
// Favorite.updateOne( {cn: req.params.name}, { $pullAll: {uid: [req.params.deleteUid] } } )

app.post('/delete', checkAuthenticated, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
        { $pull: { 
            lists: { _id: req.body.listId } 
        }
        }, (err, data) => {
            if (err) { console.log(err) }
            else {
                console.log(data)
            }
        })
    res.redirect('/')
})

app.get('/lists/:customListName', checkAuthenticated, (req, res) => {
    console.log(req.params.customListName)
    console.log(req.body)
    console.log(req.user)
})


// Login Routes
// ===============================

app.get("/home", checkNotAuthenticated, function (req, res) {
    res.render("home");
});

app.post("/home", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/signup"
}), function (req, res) {

})


// Sign up Route
// ===============================

app.get("/signup", checkNotAuthenticated, function (req, res) {
    res.render("signup")
})

app.post("/signup", checkNotAuthenticated, function (req, res) {
    User.register(new User({ 
        username: req.body.username,
        // lists: defaultLists
    }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render('signup');
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect("/")
        });
    });
});

// Logout Routes
// ======================================

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/")
});

// === Middleware to prevent user from visiting pages that need login ===
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    } 
    res.redirect('/home')
};

// === Middleware to prevent user from visiting redundent pages when they are 
// === already logged in.
function checkNotAuthenticated(req, res, next)  {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
};

app.listen(3000, function () {
    console.log("Server has started")
});