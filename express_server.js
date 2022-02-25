
const express = require("express");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const {generateRandomString, createNewUser, loginUser, urlsForUser, displayError} = require('./helpers/helpers');
const {users, urlDatabase, errorMessages} = require('./data/data');


const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");


app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'session',
  keys: ['iLikEturt13z!'],
}));


// GET:READ - REDIRECT / TO URLS PAGE
app.get("/", (req, res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};

  //Catch if user is not logged-in
  if (!user.id) {
    console.log(errorMessages.redirect.notLoggedIn);
    res.redirect(`/login`);
  }

  res.redirect(`/urls`);
});


// GET:BROWSE - SHOW ALL URLS
app.get("/urls", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  
  // If user is logged-in fetch their personal URLs
  let userUrls = {};
  if (user.id) {
    userUrls = urlsForUser(user.id);
  }

  // Pass userUrls to templateVars
  const templateVars = { user, urls: userUrls };
  return res.render("urls_index", templateVars);
});


// GET:READ - PAGE/FORM TO CREATE NEW SHORT URL
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const templateVars = { user, urls: urlDatabase };

  // Catch if user is not logged-in; Redirect to login page
  if (!user.id) {
    console.log(`Error: ${errorMessages.notLoggedInRedirect}`);
    return res.redirect("/login");
  }

  return res.render("urls_new", templateVars);
});


// GET:READ - PAGE TO VIEW SPECIFIC SHORT/LONG URL COMBO
app.get("/urls/:id", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const id = req.params.id;

  // Catch if URL id does not exist in urlDatabase
  if (!urlDatabase[id]) {
    return displayError(404, errorMessages.invalidID, res);
  }

  // Catch if user is not logged-in
  if (!user.id) {
    return displayError(401, errorMessages.notLoggedIn, res);
  }

  // Catch if user does not match the creator of the URL
  if (user.id !== urlDatabase[id].userID) {
    return displayError(403, errorMessages.notOwnerOfID, res);
  }

  const longURL = urlDatabase[id].longURL;
  const templateVars = {user, id, longURL};
  return res.render("urls_show", templateVars);
});


// GET:REDIRECT - VISIT ORIGINAL WESBSITE OF LONG URL
app.get("/u/:id", (req,res) => {
  const id = req.params.id;

  // Catch if URL id does not exist in urlDatabase
  if (!urlDatabase[id]) {
    return displayError(404, errorMessages.invalidID, res);
  }

  const longURL = urlDatabase[id].longURL;
  return res.redirect(`${longURL}`);
});

// POST:ADD - CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const longURL = req.body.longURL;

  // Catch if user is not logged-in
  if (!user.id) {
    return displayError(401, errorMessages.notLoggedIn, res);
  }

  // Catch if longURL field was blank
  if (!longURL) {
    return displayError(401, errorMessages.incompleteField.longURL, res);
  }
  
  const id = generateRandomString();
  urlDatabase[id] = {longURL, userID: user.id};
  // console.log("Added a new long/short combo to the urlDataBase");
  return res.redirect(`/urls/${id}`);
});


// POST:EDIT - MODIFY EXISTING SHORT URL
app.post("/urls/:id", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const id = req.params.id;
  const newURL = req.body.newURL;

  // Catch if user is not logged-in
  if (!user.id) {
    return displayError(401, errorMessages.notLoggedIn, res);
  }

  // Catch if user does not match the creator of the URL
  if (user.id !== urlDatabase[id].userID) {
    return displayError(403, errorMessages.notOwnerOfID, res);
  }

  // Catch if new longURL field was blank
  if (!newURL) {
    return displayError(401, errorMessages.incompleteField.longURL, res);
  }
    
  urlDatabase[id].longURL = newURL;
  // console.log(`Edited urlDatabase: Updated id ${id}'s long URL to ${newURL}`);
  return res.redirect(`/urls`);
});


// POST:DELETE - DELETE TINY/LONG COMBO FROM DATABASE
app.post("/urls/:id/delete", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const id = req.params.id;

  // Catch if user is not logged-in
  if (!user.id) {
    return displayError(401, errorMessages.notLoggedIn, res);
  }

  // Catch if user does not match the creator of the URL
  if (user.id !== urlDatabase[id].userID) {
    return displayError(403, errorMessages.notOwnerOfID, res);
  }
  
  delete urlDatabase[id];
  return res.redirect(`/urls`);
});


// GET:READ - LOGIN PAGE
app.get("/login", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const templateVars = { user, urls: urlDatabase };

  // Catch if user is already logged-in
  if (user.id) {
    console.log(`${errorMessages.redirect.alreadyLoggedIn}`);
    return res.redirect("/urls");
  }

  return res.render("login", templateVars);
});


// GET:READ - REGISTRATION PAGE
app.get("/register", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};

  // Catch if user is already logged-in
  if (user.id) {
    console.log(`${errorMessages.redirect.alreadyLoggedIn}`);
    return res.redirect("/urls");
  }

  const templateVars = { user, urls: urlDatabase };
  return res.render("register", templateVars);
});


// POST:LOGIN - LOGIN TO EXISTING USER
app.post("/login", (req,res) => {
  // Attempt to login existing user; relay error if unsuccesful
  const {error, data} = loginUser(users, req.body);
  if (error) {
    return displayError(400, error, res);
  }

  req.session["user_id"] = data.id;
  // console.log(`\n****** USER AUTHENTICATED AND LOGGED-IN! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  return res.redirect("/urls");
});


// POST:ADD - CREATE NEW USER
app.post("/register", (req,res) => {
  // Attempt to create new user; relay error if unsuccesful
  const {error, data} = createNewUser(users, req.body);
  if (error) {
    return displayError(400, error, res);
  }

  req.session["user_id"] = data.id;
  // console.log(`\n****** New User Registered! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  return res.redirect("/urls");
});


// POST:LOGOUT - LOGOUT USER (DELETE SESSION COOKIES)
app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

