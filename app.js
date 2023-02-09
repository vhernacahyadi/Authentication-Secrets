require('dotenv').config();

// console.log(process.env.API_KEY);

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");

const app = express();

// Set up express, ejs and body parser
app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


// Home route
app.get("/", function(req, res){
    res.render("home");
})

// Login route
app.get("/login", function(req, res){
    res.render("login");
})

// Register route
app.get("/register", function(req, res){
    res.render("register");
})


// Set up Mongoose
main().catch(err => console.log(err));

async function main(){
    mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});
}


// Create Schema and Model for User Collection in MongoDB
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// Encrypt the schema's password field with a secret
// If not specify which field to encrypt, it will encrypt the whole schema
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);


///////////////// REGISTER ROUTE //////////////////
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    // redirect to secrets.ejs if user already register
    newUser.save(function(err){
        if(err)
            console.log(err);
        else
            res.render("secrets");
    });    
})


//////////////// LOGIN ROUTE //////////////////////
app.post("/login", function(req, res){
    const email = req.body.username;
    const password = md5(req.body.password);

    User.findOne(
        { email: email }, 
        function(err, foundUser){
            if(err)
                console.log(err)
            else {
                if(foundUser){
                    if(foundUser.password === password)
                        res.render("secrets");
                }
            }
                
        }
    )
});







app.listen(3000, function(){
    console.log("Server started on port 3000");
})
