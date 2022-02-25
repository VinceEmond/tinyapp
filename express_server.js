
// REQUIRES
const express = require("express");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const {generateRandomString, createNewUser, loginUser, urlsForUser} = require('./helpers/helpers');
const {users, urlDatabase} = require('./data/data');


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

  // Catch if user is not logged-in
  if (!user.id) {
    console.log(`Error: Not logged-in! Redirecting to login page.`);
    return res.redirect("/login");
  }

  return res.render("urls_new", templateVars);
});


// GET:READ - PAGE TO VIEW SPECIFIC SHORT/LONG URL COMBO
app.get("/urls/:id", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};

  // Catch if URL id does not exist
  if (!urlDatabase[req.params.id]) {
    let error = `Error: Invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
    //return res.redirect("/login");
  }

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  // Catch if user does not match the creator of the URL
  if (user.id !== urlDatabase[req.params.id].userID) {
    let error = `This tiny url does not belong to this account!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  return res.render("urls_show", templateVars);
});


// GET:READ 404 ERROR PAGE
app.get("/404", (req,res)=> {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const templateVars = { user, urls: urlDatabase };

  return res.render("404", templateVars);
});


// GET:REDIRECT - VISIT ORIGINAL WESBSITE OF LONG URL
app.get("/u/:id", (req,res) => {

  // Catch if URL id does not exist
  if (!urlDatabase[req.params.id]) {
    let error = `Error: Invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
    //return res.redirect("/login");
  }

  const longURL = urlDatabase[req.params.id].longURL;
  return res.redirect(`${longURL}`);
});


// GET:READ - REGISTRATION PAGE
app.get("/register", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};

  // Catch if user is already logged-in
  if (user.id) {
    let error = `Error: You are already logged-in with the email ${user.email}!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
  }

  const templateVars = { user, urls: urlDatabase };
  return res.render("register", templateVars);
});


// GET:READ - LOGIN PAGE
app.get("/login", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const templateVars = { user, urls: urlDatabase };

  // Catch if user is already logged-in
  if (user.id) {
    console.log(`User with email ${user.email} (user.id: ${user.id}) is already logged-in! Redirecting to /urls.`);
    return res.redirect("/urls");
  }

  return res.render("login", templateVars);
});


// POST:EDIT - MODIFY LONG URL FOR EXISTING SHORT URL
app.post("/urls/:id", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const id = req.params.id;
  const newURL = req.body.newURL;

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
  //return res.redirect("/login");
  }

  // Catch if URL id does not exist
  if (!urlDatabase[req.params.id]) {
    let error = `This is an invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
    //return res.redirect("/login");
  }

  // Catch if current user does not match the creator of URL
  if (user.id !== urlDatabase[id].userID) {
    let error = `You do not have permission to edit this tinyurl!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }
  
  urlDatabase[id].longURL = newURL;
  // console.log(`Edited urlDatabase: Updated id ${id}'s long URL to ${newURL}`);
  // console.log("urlDatabase", urlDatabase);
  return res.redirect(`/urls/${id}`);
});


// POST:ADD - CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  const id = generateRandomString();
  urlDatabase[id] = {longURL : req.body.longURL, userID: user.id};
  // console.log("Added a new long/short combo to the urlDataBase");
  // console.log("urlDatabase", urlDatabase);
  return res.redirect(`/urls/${id}`);
});


// POST:ADD - CREATE NEW USER
app.post("/register", (req,res) => {
  // Attempt to create new user; relay error if unsuccesful
  const {error, data} = createNewUser(users, req.body);
  if (error) {
    console.log(error);
    res.statusMessage = error;
    return res.status(400).send(error);
  }

  req.session["user_id"] = data.id;
  // console.log(`\n****** New User Registered! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  return res.redirect("/urls");
});


// POST:LOGIN - LOGIN TO EXISTING USER
app.post("/login", (req,res) => {
  // Attempt to login existing user; relay error if unsuccesful
  const {error, data} = loginUser(users, req.body);
  if (error) {
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
  }

  req.session["user_id"] = data.id;
  // console.log(`\n****** USER AUTHENTICATED AND LOGGED-IN! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  return res.redirect("/urls");
});


// POST:LOGOUT - LOGOUT USER (DELETE SESSION COOKIES)
app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect("/urls");
});


// POST:DELETE - DELETE TINY/LONG COMBO FROM DATABASE
app.post("/urls/:id/delete", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const id = req.params.id;

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  // Catch if URL id does not exist
  if (!urlDatabase[id]) {
    let error = `This is an invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
    //return res.redirect("/login");
  }

  // Catch if current user does not match the creator of URL
  if (user.id !== urlDatabase[id].userID) {
    let error = `This tiny url does not belong to this account!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  delete urlDatabase[id];
  return res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

