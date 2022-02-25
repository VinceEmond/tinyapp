const bcrypt = require('bcryptjs');
const {urlDatabase ,errorMessages} = require('../data/data');


const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};


const displayError = (errorCode, errorMsg,res) =>{
  let error = `Error: ${errorMsg}`;
  console.log(error);
  res.statusMessage = error;
  return res.status(errorCode).send(error);
};


const getUserByEmail = (email, users) => {
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
  if (getUserByEmail(data.email, users)) {
    return {error: errorMessages.alreadyRegistered, data: null};
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
    return {error: errorMessages.incompleteField.email, data: null};
  } else if (!password) {
    return {error: errorMessages.incompleteField.password, data: null};
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
  if (!getUserByEmail(data.email, users)) {
    return {error: errorMessages.notYetRegistered, data: null};
  }
  
  const formData = data;
  const databaseData = getUserByEmail(formData.email, users);

  // Catch non-matching password
  if (!bcrypt.compareSync(formData.password, databaseData.password)) {
    return {error: errorMessages.incorrectPassword, data: null};
  }

  return {error: null, data: databaseData};
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
  urlsForUser,
  displayError
};