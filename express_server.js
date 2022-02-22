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
  res.send("Hello Everyone!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req,res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(302, `/urls/${shortURL}`);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!'};
  res.render("hello_world", templateVars);
});

app.get("/404", (req,res)=> {
  res.render("404");
});

app.get("/urls/:shortURL", (req,res) => {

  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }
  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req,res) => {

  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }

  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(`${longURL}`);
});



app.get("/urls/:shortURL", (req,res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL/delete", (req,res) => {

  if (!(urlDatabase[req.params.shortURL])) {
    res.redirect(`../404`);
  }

  console.log("urlDatabase before:", urlDatabase);
  delete urlDatabase[req.params.shortURL];
  console.log("urlDatabase after:", urlDatabase);
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

