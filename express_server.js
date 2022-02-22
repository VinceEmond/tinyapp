// express_server.js


const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "r3rfwr": "http://stuff.com"
};

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};



app.get("/", (req, res) => {
  res.redirect(`../urls`);
});

// GET:BROWSE - SHOW ALL URLS
app.get("/urls", (req,res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// GET:READ - PAGE/FORM TO CREATE NEW SHORT URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// GET:READ - PAGE TO VIEW SPECIFIC SHORT/LONG URL COMBO
app.get("/urls/:shortURL", (req,res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

// GET:READ 404 ERROR PAGE
app.get("/404", (req,res)=> {
  res.render("404");
});

// GET:REDIRECT - VISIT ORIGINAL WWW LONG URL
app.get("/u/:shortURL", (req,res) => {

  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }

  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(`${longURL}`);
});

// POST:EDIT - LONG URL FOR EXISTING SHORT URL
app.post("/urls/:shortURL", (req,res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

// POST:ADD - CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(302, `/urls/${shortURL}`);
});

// POST:DELETE - TINY/LONG COMBO FROM DATABASE
app.post("/urls/:shortURL/delete", (req,res) => {
  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

