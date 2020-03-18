const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true })
const mongooseUsername = "edgar-admin"
const mongoosePassword = "test1234"
mongoose.connect(`mongodb+srv://${mongooseUsername}:${mongoosePassword}@cluster0-sftgr.mongodb.net/todolistDB`, 
{ useNewUrlParser: true,  useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema({
    user: String,
    name: String
});
const Item = mongoose.model("Item", itemsSchema)

app.get("/", (req, res) => {
    res.render("pages/index")
})

app.post("/", (req, res) => {
    console.log(req.body)
})

app.get("/register", (req, res) => {
    res.send("<h1>THIS IS WHERE THE REGISTER PAGE WILL BE</h1>")
})

app.get("/remember-password", (req, res) => {
    res.send("<h1>THIS IS WHERE THE REMEMBER ME PAGE WILL BE</h1>")
})

// after we register and authorize user
app.get("/:user", (req, res) => {
    const fName = req.params.user
    // res.send(`<h1>This is ${fName}'s to do lists`)
    const item = new Item({
        user: fName,
        name: `This is ${fName}'s first item`
    })

    item.save(err => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Logged ${fName}'s first item`);
            res.send(`<h1>This is ${fName}'s to do lists`);
        };
    })
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started");
});