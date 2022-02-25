const bcrypt = require('bcryptjs');
const {urlDatabase} = require('../data/data');

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const getUserByEmail = (users, email) => {
  let foundUser = undefined;

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

module.exports = {
  generateRandomString,
  getUserByEmail,
  createNewUser,
  completedForm,
  loginUser,
  urlsForUser
};