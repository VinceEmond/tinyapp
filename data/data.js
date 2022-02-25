const users = {};
const urlDatabase = {};

const errorMessages = {
  invalidID: 'Invalid tiny url ID!',
  incorrectPassword: 'The password is incorrect!',
  notLoggedIn: 'User not logged-in!',
  notOwnerOfID: 'This tiny URL does not belong to this account!',
  notYetRegistered: 'This email address is not linked to any registered user account!',
  alreadyLoggedIn: 'User currently logged-in. Logout before you can register a new account.',
  alreadyRegistered: 'This email address is already registered to a user!',
  redirect: {
    notLoggedIn:'Redirect Notice: Not logged-in! Redirecting to login page.',
    alreadyLoggedIn:'Redirect Notice: User is already logged-in! Redirecting to /urls'
  },
  incompleteField: {
    email: `The form is incomplete: Please enter your email!`,
    password: `The form is incomplete: Please enter your password!`,
    longURL: `The form is incomplete: Please enter a valid URL`
  }
};

module.exports = {
  urlDatabase,
  users,
  errorMessages
};