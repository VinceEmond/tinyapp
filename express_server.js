const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "r3rfwr": "http://stuff.com"
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
  const {email, password} =  userInfo;
  const userId = generateRandomString();

  // Catch Incomplete form fields
  if (!email || !password) {
    return {error: "The form is incomplete. Please enter valid data for all required fields!", data: null};
  }

  // Catch if email already exists in users
  if (findByEmail(users,email)) {
    // Return 400 status code
    return {error: `Email "${email}" is already registered to a user!`, data: null};
  }

  const newUser = {userId, email, password};
  users[userId] = newUser;

  console.log(`Completed user creation for ${email}`);
  return {error: null, data: newUser};
};

// GET:READ - REDIRECT / TO URLS PAGE
app.get("/", (req, res) => {
  res.redirect(`../urls`);
});

// GET:BROWSE - SHOW ALL URLS
app.get("/urls", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  res.render("urls_index", templateVars);
});

// GET:READ - PAGE/FORM TO CREATE NEW SHORT URL
app.get("/urls/new", (req, res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  res.render("urls_new", templateVars);
});

// GET:READ - PAGE TO VIEW SPECIFIC SHORT/LONG URL COMBO
app.get("/urls/:shortURL", (req,res) => {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = {
    user,
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

// GET:READ 404 ERROR PAGE
app.get("/404", (req,res)=> {
  const user = fetchUserInformation(users, req.cookies.user_id);
  const templateVars = { user, urls: urlDatabase };

  res.render("404", templateVars);
});

// GET:REDIRECT - VISIT ORIGINAL WWW LONG URL
app.get("/u/:shortURL", (req,res) => {

  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }

  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(`${longURL}`);
});

// GET: READ - REGISTRATION PAGE
app.get("/register", (req,res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("register", templateVars);
});

// POST:EDIT - LONG URL FOR EXISTING SHORT URL
app.post("/urls/:shortURL", (req,res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

// POST:ADD - CREATE NEW USER
app.post("/register", (req,res) => {
  const {error, data} = createNewUser(users, req.body);

  if (error) {
    console.log(error);
    res.statusMessage = error;
    return res.status(400).send(error);
  }

  res.cookie("user_id", data.userId);
  console.log(`\n****** New User Registered! ******** \n UserId: ${data.userId}\n Email: ${data.email}\n Password: ${data.password}\n`);
  res.redirect("/urls");
});

// POST:ADD - CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(302, `/urls/${shortURL}`);
});

// POST:DELETE - DELETE TINY/LONG COMBO FROM DATABASE
app.post("/urls/:shortURL/delete", (req,res) => {
  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

// POST:DELETE - LOGOUT USER BY DELETING COOKIES
app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// POST: LOGIN USER
// app.post("/login", (req,res) => {
//   res.cookie("username",req.body.username);
//   res.redirect("/urls");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

