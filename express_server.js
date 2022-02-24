
// REQUIRES
const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan("dev"));


// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
//   "r3rfwr": "http://stuff.com"
// };

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

const fetchUserInformation = (users, userId) => {
  let userInfo = undefined;

  if (!userId) {
    userInfo = {};
    return userInfo;
  }

  if (users[userId]) {
    userInfo = users[userId];
  } else {
    userInfo = {};
  }
  return userInfo;
};

const findByEmail = (users, email) => {
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
  if (findByEmail(users, data.email)) {
    return {error: `Email "${data.email}" is already registered to a user!`, data: null};
  }
  
  // Create user and add to the database
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(data.password, 10);
  const newUser = {id, email: data.email, password: hashedPassword};
  users[id] = newUser;

  // console.log(`Completed "createNewUser for email: ${data.email} with error: ${error}`);
  return {error: null, data: newUser};
};

const completedForm = (userInfo) => {
  const {email, password} =  userInfo;
  const formIncomplete = "The form is incomplete.";

  // Catch if email or password is blank
  if (!email) {
    return {error: `${formIncomplete} Please enter your email!`, data: null};
  } else if (!password) {
    return {error: `${formIncomplete} Please enter your password!`, data: null};
  }

  return {error: null, data: {email, password}};
};

const loginUser = (users, userInfo) => {
  // Catch if form inputs are blank
  const {error, data} = completedForm(userInfo);
  if (error) {
    return {error, data: null};
  }

  // Catch if email does not exists in users database
  if (!findByEmail(users, data.email)) {
    return {error: `Email "${data.email}" does not exist in our database!`, data: null};
  }

  const formData = data;
  const databaseUser = findByEmail(users, formData.email);

  // Catch non-matching password
  if (!bcrypt.compareSync(formData.password, databaseUser.password)) {
    return {error: `Pasword is incorrect!`, data: null};
  }

  return {error: null, data:databaseUser};
};

const urlsForUser = (id) => {
  const userUrls = {};

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
  const user = fetchUserInformation(users, req.cookies.user_id);
  let userUrls = {};

  // If user is logged-in fetch their personal URLs
  if (user.id) {
    userUrls = urlsForUser(user.id);
  }

  const templateVars = { user, urls: userUrls };

  res.render("urls_index", templateVars);
});

// GET:READ - PAGE/FORM TO CREATE NEW SHORT URL
app.get("/urls/new", (req, res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  // Catch if user is not logged-in
  if (!user.id) {
    console.log(`You are not logged-in logged-in! Redirecting to login page.`);
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// GET:READ - PAGE TO VIEW SPECIFIC SHORT/LONG URL COMBO
app.get("/urls/:shortURL", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);

  // Catch if shortURL does not exist
  if (!urlDatabase[req.params.shortURL]) {
    let error = `This is an invalid tiny url!`;
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

  res.render("urls_show", templateVars);
});

// GET:READ 404 ERROR PAGE
app.get("/404", (req,res)=> {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  res.render("404", templateVars);
});

// GET:REDIRECT - VISIT ORIGINAL WESBSITE OF LONG URL
app.get("/u/:shortURL", (req,res) => {

  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(`${longURL}`);
});

// GET: READ - REGISTRATION PAGE
app.get("/register", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  // Catch if user is already logged-in
  if (user.id) {
    console.log(`User with email ${user.email} (user.id: ${user.id}) is already logged-in! Redirecting to /urls.`);
    return res.redirect("/urls");
  }

  res.render("register", templateVars);
});

// GET: READ - LOGIN PAGE
app.get("/login", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  // Catch if user is already logged-in
  if (user.id) {
    console.log(`User with email ${user.email} (user.id: ${user.id}) is already logged-in! Redirecting to /urls.`);
    return res.redirect("/urls");
  }

  res.render("login", templateVars);
});

// POST:EDIT - LONG URL FOR EXISTING SHORT URL
app.post("/urls/:shortURL", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
 
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

  // Catch if user does not match the creator of the URL
  if (user.id !== urlDatabase[req.params.shortURL].userID) {
    let error = `This tiny url does not belong to this account!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
  //return res.redirect("/login");
  }

  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  console.log(`Edited change the long URL to ${newURL} for shortURL ${shortURL} in the urlDataBase`);
  console.log("urlDatabase", urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// POST:ADD - CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);

  // Catch if user is not logged-in
  if (!user.id) {
    let error = `You are not logged-in! Redirecting to login page.`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  console.log(`Yes you are logged-in! Processing post request.`);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL : req.body.longURL, userID: user.id};

  console.log("Added a new long/short combo to the urlDataBase");
  console.log("urlDatabase", urlDatabase);
  res.redirect(302, `/urls/${shortURL}`);
});

// POST:ADD - CREATE NEW USER
app.post("/register", (req,res) => {
  const {error, data} = createNewUser(users, req.body);
  if (error) {
    console.log(error);
    res.statusMessage = error;
    return res.status(400).send(error);
  }

  res.cookie("user_id", data.id);
  console.log(`\n****** New User Registered! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  res.redirect("/urls");
});

// POST:LOGIN - LOGIN TO EXISTING USER
app.post("/login", (req,res) => {
  const {error, data} = loginUser(users, req.body);

  if (error) {
    console.log(error);
    res.statusMessage = error;
    return res.status(403).send(error);
  }

  res.cookie("user_id", data.id);
  console.log(`\n****** USER AUTHENTICATED AND LOGGED-IN! ******** \n UserId: ${data.id}\n Email: ${data.email}\n Password: ${data.password}\n`);
  res.redirect("/urls");
});

// POST:LOGOUT - LOGOUT USER BY DELETING COOKIES
app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// POST:DELETE - DELETE TINY/LONG COMBO FROM DATABASE
app.post("/urls/:shortURL/delete", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);

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

  // Catch if user does not match the creator of the URL
  if (user.id !== urlDatabase[req.params.shortURL].userID) {
    let error = `This tiny url does not belong to this account!`;
    console.log(error);
    res.statusMessage = error;
    return res.status(401).send(error);
    //return res.redirect("/login");
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

