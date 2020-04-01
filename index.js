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
// mongoose.connect(`mongodb+srv://${mongooseUsername}:${mongoosePassword}@cluster0-sftgr.mongodb.net/todolistDB`,
    // { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect("mongodb://localhost:27017/1800todolist", 
{useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false})

// MONGOOSE SCHEMAS

const weatherSchema = new mongoose.Schema({
    country         : String,
    city            : String,
    temp            : Number,
    precip          : Number,
    wind            : Number,
    direction       : Number
});

const listReminderSchema = new mongoose.Schema({
    title           : String,
    date            : Date,
    details         : String,
    weather         : {
        type        : weatherSchema,
        "default"   : {
            country : "Richmond",
            temp    : 45
        }
    }
});

const listSchema = new mongoose.Schema({
    title           : String,
    tags            : {
        type        : Array,
        "default"   : ["tag1", "tag2"]
    },
    items           : {
        type        : [listReminderSchema],
        "default"   : [{
            title   : "First Reminder!",
            date    : Date.now()
        }]

    }
});

const userSchema = new mongoose.Schema({
    username        : String,
    password        : String,
    lists           : {
        type        : [listSchema],
        "default"   : [{
            title   : "This page is where your lists will be"
        }]
    }
});
userSchema.plugin(passportMongoose);
const User = mongoose.model("User", userSchema);


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
    // console.log(req.user.lists)
    res.render("secret", {
        newListItems: req.user.lists,
        user: req.user
    });
    // res.render('reminders')
});

app.post('/', checkAuthenticated, (req, res) => {
    // console.log(req.body);
    console.log(req.body.longitude)
    const newList = {
        title: req.body.listTitle,
        date: req.body.listDate
    }
    // calling the user document and appending new list item and saving it to DB
    User.findById(req.body.userId, (err, user) => {
        if (err) { console.log(err) }
        else {
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
    // console.log(req.user)
    // console.log(req.body);
    console.log(req.params)
    const allUserLists = req.user.lists
    const customListName = req.params.customListName
    const listId = req.params.listId

    // Is there a better way to store list Id than putting it in params?
    const currentList = allUserLists.find(element => element._id == listId)
    
    res.render("list", {
        listName: customListName,
        newListItems: currentList.items,
        user: req.user,
        listId: listId
    });
})

app.post('/deleteReminder', checkAuthenticated, (req, res) => {
    // console.log(req.body)
    if (!req.user) {
        console.log("User not there")
    }
    const listName = req.body.listName
    const listId = req.body.currentListId
    const reminderId = req.body.reminderId

    User.findById(req.user._id, (err, obj) => {
        if (err) { console.log(err) }
        else {
            obj.lists.id(listId).items.id(reminderId).remove();
            obj.save(err => {
                if (err) { console.log(err); }
            })
        }
    })
    res.redirect(`/lists/${listName}/${listId}`)
})

app.post('/umbrellaReminder', checkAuthenticated, (req, res) => {

    console.log(req.body)
    if (!req.user) {
        console.log("User not there")
    }
})

app.post('/editReminder', checkAuthenticated, (req, res) => {

    console.log(req.body)
    if (!req.user) {
        console.log("User not there")
    }
})

app.post('/addReminder', checkAuthenticated, (req, res) => {

    console.log(req.body)
    // console.log(req.body)
    // if (!req.user) {
    //     console.log("User not there")
    // }
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






    // User.findById(req.user._id, (err, user) => {
    //     if (err) { console.log(err) }
    //     else {
    //         user.lists.findOneAndUpdate(
    //             { _id: req.body.currentListId },
    //             { $pull: {
    //                 items: { _id: req.body.reminderId}
    //             }}, (err, data) => {
    //                 if (err) { console.log(err) }
    //                 else { console.log(data) }
    //             }
    //         )
    //     }
    // })
    
    // const currentList = allUserLists.find(element => element._id == listId)
    // console.log(currentList)
    // const toDeleteReminder = currentList.items.find(element => element._id == reminderId)
    // console.log(toDeleteReminder)