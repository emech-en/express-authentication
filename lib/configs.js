var mongoose = require('mongoose');
var tokenGenerator = require('./token-generator');


// tokenPlace wich authentication token should be
var tokenPlace;

// name of the authentication token param
var tokenName;

// the secretKey for encryption
var secretKey;

// the expiration time in minute
var expirationTime;

// the collection that stores the tokens
var collectionName;

// default options
var defaults = {
  mongoose: {
    uri: 'mongodb://localhost:27000/authentication',
    options: {}
  },
  redis: {}
};

/*

*/
var _initTokenGenerator = function(secretKey, algorithm) {
  return tokenGenerator.init(secretKey, algorithm)
};

/*

*/
var _isValidExpirationTime = function() {
  if (!expirationTime)
    return true;

  if (typeof expirationTime !== 'number')
    return false;

  return true;
}

/*

*/
var _isValidTokenName = function() {
  if (!tokenName)
    return true;

  if (typeof !tokenName === 'string')
    return false;

  return true;
};

var _isValidTokenPlace = function() {
  if (!tokenPlace)
    return true;

  if (['query', 'cookies', 'body'].indexOf(tokenPlace) === -1)
    return false;

  if (tokenPlace === 'cookies')
    console.warn('You should use cookieParser middleware before init authentication module.');

  if (tokenPlace === 'body')
    console.warn('You should use bodyParser middleware before init authentication module.');

  return true;
}

var _isValidCollectionName = function() {
  if (!collectionName)
    return true;

  if (typeof collectionName !== 'string')
    return false;

  return true;
}

var _checkParams = function() {

  // checking token place
  if (!_isValidTokenPlace())
    throw new Error('Invalid tokenPlace');

  // checking token name
  if (!_isValidTokenName())
    throw new Error('Authentication tokenName should be string');

  // checking expiration time
  if (!_isValidExpirationTime())
    return new Error('Expiration time should be a number greater than zero.');

  if (!_isValidCollectionName())
    return new Error('collection Name should be string.');
}

/*
  [private function]
  Init the module configurations
*/
var _init = function(options) {

  // init the options if is undefined.
  options = options || {};

  // init the token generator
  _initTokenGenerator(options.secretKey, options.algorithm)

  // check mongoose options
  options.mongoose = options.mongoose || {};
  options.mongoose.uri = options.mongoose.uri || defaults.mongoose.uri;
  options.mongoose.options = options.mongoose.options || defaults.mongoose.options;
  if (!mongoose.connection.readyState)
    mongoose.connect(options.mongoose.uri, options.mongoose.options);

  // setting params
  tokenPlace = options.tokenPlace;
  tokenName = options.tokenName;
  expirationTime = options.expirationTime;
  collectionName = options.collectionName;

  // check parameters
  _checkParams();
};


/*
  return module interface. 
*/
exports = module.exports = {
  init: function(options) {
    _init(options);
  },
  getTokenPlace: function() {
    return tokenPlace;
  },
  getTokenName: function() {
    return tokenName;
  },
  getExpirationTime: function() {
    return expirationTime * 60 * 1000;
  },
  getCollectionName: function() {
    return collectionName;
  }
};