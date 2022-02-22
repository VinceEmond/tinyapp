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
  // urlDatabase[req.body.longURL];
  // console.log(req.body);  // Log the POST request body to the console
  // console.log("req.body.longURL",req.body.longURL);
  // console.log("Random String 1:", generateRandomString());
  // console.log("Random String 2:", generateRandomString());
  // console.log("Random String 3:", generateRandomString());
  
  console.log("urlDatabase", urlDatabase);
  urlDatabase[generateRandomString()] = req.body.longURL;
  console.log("urlDatabase", urlDatabase);
  res.send("Ok");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!'};
  res.render("hello_world", templateVars);
});

app.get("/urls/:shortURL", (req,res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

