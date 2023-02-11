require('dotenv').config();

// console.log(process.env.API_KEY);

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate")
const app = express();

// Set up express, ejs and body parser
app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Set up express-session
app.use(session({
    secret: 'Our little secret',    // can be any long string, make sure saved in .env
    resave: false,
    saveUninitialized: false
}));

// Set up Passport.JS
app.use(passport.initialize());
app.use(passport.session());

// Set up Mongoose
mongoose.set("strictQuery", true);
main().catch(err => console.log(err));

async function main(){
    mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});
}

// Create Schema and Model for User Collection in MongoDB
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

// Add passport-local-mongoose as plugin to userSchema
userSchema.plugin(passportLocalMongoose);

// Add findOrCreate as plugin to userSchema
userSchema.plugin(findOrCreate);

// Encrypt the schema's password field with a secret
// If not specify which field to encrypt, it will encrypt the whole schema
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);

// Set up Passport-Local Mongoose
passport.use(User.createStrategy());

// Old way of serializing and deserializing users using passport
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// New way:
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username, name: user.name });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});


// Configure Passport Google OAuth2.0 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  // accessToken allows us to get data related to the user
  // profile contains anything about the user we have access to, e.g. email and Google ID
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// Home route
app.get("/", function(req, res){
    res.render("home");
})

// Route for google auth
app.get('/auth/google',
  passport.authenticate('google',
    { 
        scope: ['profile'] 
    }
)
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

// Login route
app.get("/login", function(req, res){
    res.render("login");
})

// Register route
app.get("/register", function(req, res){
    res.render("register");
})

// Secrets route
app.get("/secrets", function(req, res){
    // If user is logged in, go to secrets.js
    if(req.isAuthenticated())
        res.render("secrets");
    // Else redirect to login
    else
        res.render("login");
})

// Logout route
app.get("/logout", function(req, res){
    // De authenticate user and end user's session
    req.logout(function(err){
        if(err)
            return next(err);
        
        res.redirect("/");
    })

})


///////////////// REGISTER ROUTE //////////////////
app.post("/register", function(req, res){
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        
    //     // For MD5:
    //     // const newUser = new User({
    //     //     email: req.body.username,
    //     //     password: md5(req.body.password)
    //     // });
    
    //     // bcrypt
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });

    //     // redirect to secrets.ejs if user already register
    //     newUser.save(function(err){
    //         if(err)
    //             console.log(err);
    //         else
    //             res.render("secrets");
    //     });
    // });

    // Registration using Passport Local Mongoose
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            // Authenticate and create session for the user
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
})


//////////////// LOGIN ROUTE //////////////////////
app.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), function(req, res){
    res.redirect('/secrets');   // for passport js

    // const email = req.body.username;
    // const password = req.body.password;
    // //const password = md5(req.body.password);

    // User.findOne(
    //     { email: email }, 
    //     function(err, foundUser){
    //         if(err)
    //             console.log(err)
    //         else {
    //             if(foundUser){
    //                 // For md5 and non hash:
    //                 // if(foundUser.password === password)
    //                 //     res.render("secrets");

    //                 bcrypt.compare(password, foundUser.password, function(err, result){
    //                     if(result)
    //                         res.render("secrets");
    //                 })
    //             }
    //         }
                
    //     }
    // )
});



app.listen(3000, function(){
    console.log("Server started on port 3000");
})
