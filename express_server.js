
// REQUIRES
const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');

const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'session',
  keys: ['iLikEturt13z!'],
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL:"http://www.google.com",
    userID: "userRandomID"
  },
  "r3rfwr": {
    longURL:"http://www.perdu.com",
    userID: "userRandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const getUserByEmail = (users, email) => {
  let foundUser = null;

  Object.keys(users).forEach(function(key) {
    if (users[key].email === email) {
      foundUser = users[key];
    }
  });

  return foundUser;
};

const createNewUser = (users, userInfo) => {
  // Catch if form inputs are blank
  const {error, data} = completedForm(userInfo);
  if (error) {
    return {error, data: null};
  }

  // Catch if email already exists in users database
  if (getUserByEmail(users, data.email)) {
    return {error: `Email "${data.email}" is already registered to a user!`, data: null};
  }
  
  // Create user and add to the database
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(data.password, 10);
  const newUser = {id, email: data.email, password: hashedPassword};
  users[id] = newUser;

  // console.log(`Completed "createNewUser for email: ${data.email}`);
  return {error: null, data: newUser};
};

const completedForm = (userInfo) => {
  const {email, password} =  userInfo;

  // Catch if email or password field is blank
  if (!email) {
    return {error: `The form is incomplete: Please enter your email!`, data: null};
  } else if (!password) {
    return {error: `The form is incomplete: Please enter your password!`, data: null};
  }

  // console.log(`All inputs for the form were filled`);
  return {error: null, data: {email, password}};
};

const loginUser = (users, userInfo) => {
  // Catch if form inputs are blank
  const {error, data} = completedForm(userInfo);
  if (error) {
    return {error, data: null};
  }

  // Catch if email does not exists in users database
  if (!getUserByEmail(users, data.email)) {
    return {error: `Email "${data.email}" does not exist in our database!`, data: null};
  }

  const formData = data;
  const databaseUser = getUserByEmail(users, formData.email);

  // Catch non-matching password
  if (!bcrypt.compareSync(formData.password, databaseUser.password)) {
    return {error: `Pasword is incorrect!`, data: null};
  }

  return {error: null, data: databaseUser};
};

const urlsForUser = (id) => {
  const userUrls = {};

  // Loop through database to collect all URLs associated to the id
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userUrls[key] = urlDatabase[key];
    }
  }

  return userUrls;
};

// GET:READ - REDIRECT / TO URLS PAGE
app.get("/", (req, res) => {
  res.redirect(`../urls`);
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
    console.log(`You are not logged-in logged-in! Redirecting to login page.`);
    return res.redirect("/login");
  }

  return res.render("urls_new", templateVars);
});

// GET:READ - PAGE TO VIEW SPECIFIC SHORT/LONG URL COMBO
app.get("/urls/:shortURL", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};

  // Catch if shortURL does not exist
  if (!urlDatabase[req.params.shortURL]) {
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
  if (user.id !== urlDatabase[req.params.shortURL].userID) {
    let error = `This tiny url does not belong to this account!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  const templateVars = {
    user,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
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
app.get("/u/:shortURL", (req,res) => {

  // Catch if shortURL does not exist
  if (!urlDatabase[req.params.shortURL]) {
    let error = `Error: Invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
  //return res.redirect("/login");
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(`${longURL}`);
});

// GET: READ - REGISTRATION PAGE
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

// GET: READ - LOGIN PAGE
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

// POST:EDIT - LONG URL FOR EXISTING SHORT URL
app.post("/urls/:shortURL", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
  //return res.redirect("/login");
  }

  // Catch if shortURL does not exist
  if (!urlDatabase[req.params.shortURL]) {
    let error = `This is an invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
    //return res.redirect("/login");
  }

  // Catch if current user does not match the creator of URL
  if (user.id !== urlDatabase[shortURL].userID) {
    let error = `You do not have permission to edit this tinyurl!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }
  
  urlDatabase[shortURL].longURL = newURL;
  // console.log(`Edited urlDatabase: Updated shortURL ${shortURL}'s long URL to ${newURL}`);
  // console.log("urlDatabase", urlDatabase);
  return res.redirect(`/urls/${shortURL}`);
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

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL : req.body.longURL, userID: user.id};
  // console.log("Added a new long/short combo to the urlDataBase");
  // console.log("urlDatabase", urlDatabase);
  return res.redirect(`/urls/${shortURL}`);
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
    return res.status(403).send(error);
  }

  req.session["user_id"] = data.id;
  // console.log(`\n****** USER AUTHENTICATED AND LOGGED-IN! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  return res.redirect("/urls");
});

// POST:LOGOUT - LOGOUT USER BY DELETING COOKIES
app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect("/urls");
});

// POST:DELETE - DELETE TINY/LONG COMBO FROM DATABASE
app.post("/urls/:shortURL/delete", (req,res) => {
  const user = users[req.session.user_id] ? users[req.session.user_id] : {};
  const shortURL = req.params.shortURL;

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  // Catch if shortURL does not exist
  if (!urlDatabase[shortURL]) {
    let error = `This is an invalid tiny url!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(404).send(error);
  //return res.redirect("/login");
  }

  // Catch if current user does not match the creator of URL
  if (user.id !== urlDatabase[shortURL].userID) {
    let error = `This tiny url does not belong to this account!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  delete urlDatabase[shortURL];
  return res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

