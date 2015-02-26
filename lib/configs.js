var mongoose = require('mongoose');

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
    uri: 'mongodb://localhost:27017/authentication',
    options: {},
    collectionName: 'tokens'
  },
  redis: {},
  tokenPlace: 'query',
  tokenName: 'token',
  expirationTime: 10
};

/*
  [private function]
  Init the module configurations
*/
var _init = function(options) {

  // init the options if is undefiend.
  options = options || {};

  // checking secret key.
  if (!options.secret || typeof options.secret !== 'string')
    throw new Error('Invalid secret key');
  secretKey = options.secret;

  // checking expiration time.
  expirationTime = options.expirationTime || defaults.expirationTime;
  if (typeof expirationTime !== 'number')
    throw new Error('expirationTime should be number.');

  // check mongoose options
  options.mongoose = options.mongoose || {};
  options.mongoose.uri = options.mongoose.uri || defaults.mongoose.uri;
  options.mongoose.options = options.mongoose.options || defaults.mongoose.options;
  mongoose.connect(options.mongoose.uri, options.mongoose.options);
  collectionName = options.mongoose.collectionName || defaults.mongoose.collectionName;

  // checking token options
  tokenPlace = options.tokenPlace || defaults.tokenPlace;
  tokenName = options.tokenName || defaults.tokenName;

  // checking token place
  if (['query', 'cookies', 'body'].indexOf(tokenPlace) === -1)
    throw new Error('Invalid tokenPlace option');

  // checking token name
  if (typeof tokenName !== 'string')
    throw new Error('Authentication tokenName should be string');

  if (tokenPlace === 'cookies')
    console.warn('You should use cookieParser middleware before init authentication module.');

  if (tokenPlace === 'body')
    console.warn('You should use bodyParser middleware before init authentication module.');
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
  getSecretKey: function() {
    return secretKey;
  },
  getExpirationTime: function() {
    return expirationTime * 60000;
  },
  getCollectionName: function() {
    return collectionName;
  }
};