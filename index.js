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

const mongooseUsername = "edgar-admin"
const mongoosePassword = "test1234"
mongoose.connect(`mongodb+srv://${mongooseUsername}:${mongoosePassword}@cluster0-sftgr.mongodb.net/todolistDB`,
    { useNewUrlParser: true, useUnifiedTopology: true })
// mongoose.connect("mongodb://localhost:27017/1800todolist", 
// {useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false})

// MONGOOSE SCHEMAS

const listItemSchema = new mongoose.Schema({
    name: String,
    date: Date,
    details: String
})
const ListItem = mongoose.model('ListItem', listItemSchema)

// Default items in list
const defaultItem1 = new ListItem({
    name: "Welcome to Memento!",
    date: Date.now(),
    details: "Feel free to delete me"
})

const defaultItem2 = new ListItem({
    name: "These are the default items",
    date: Date.now(),
    details: "Feel free to delete me"
})

const listSchema = new mongoose.Schema({
    name: String,
    date: Date,
    tags: {
        type: Array,
        "default": ['tag1', 'tag2']
    },
    items: {
        type: Array,
        "default": [defaultItem1, defaultItem2]
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
app.use(express.static(__dirname + "/public"));


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


// AUTHENTICATED ROUTES ROUTES
// ===============================


// List of Reminder LISTS ================================================
app.get("/", checkAuthenticated, function (req, res) {
    console.log(req.user.lists)
    res.render("secret", {
        newListItems: req.user.lists,
        user: req.user
    });
    // res.render('reminders')
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


// Reminder List ==================================================================================

app.get('/lists/:customListName/:listId', checkAuthenticated, (req, res) => {
    const allUserLists = req.user.lists
    const customListName = req.params.customListName
    const listId = req.params.listId
    const currentList = allUserLists.find(element => element._id == listId)

    res.render("list", {
        listName: customListName,
        newListItems: currentList.items,
        user: req.user
    });

    // res.render('reminders')
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

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started");
});