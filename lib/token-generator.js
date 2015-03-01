var jwt = require('jsonwebtoken');

var DEFAULT_ALGORITHM = 'HS256';
var VALID_ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
var SECRET_KEY_MIN_LENGTH = 6;

// private fields
var _secretKey;
var _algorithm;
var _inited;


/*
  [private static function]
  Checks the given algorithm

  params: 
    alg: [string] the givent algorithm

  returns: 
    [boolean]: if algorithm is valid return true.   
*/
var isValidAlgorithm = function(alg) {
  if (typeof alg !== 'string')
    return false;

  if (VALID_ALGORITHMS.indexOf(alg.toUpperCase()) === -1)
    return false;

  return true;
};


/*
  [private static function]
  Checks the given secretKey

  params: 
    secretKey: [string] the givent secret

  returns: 
    [boolean]: if secretKey is valid return true.   
*/
var isValidSecretKey = function(secretKey) {
  if (!secretKey || typeof secretKey !== 'string')
    return false;

  if (secretKey.length < SECRET_KEY_MIN_LENGTH)
    return false;

  return true;
};

/*
  [private static function]
  Checks that module has been initialized or not.

  returns: 
    [boolean]: if module is initialized true.   
*/
var isInited = function() {
  return _inited || false;
}

/*
  [private static function]
  create error function

  params: 
    name: [string] name of the error
    message: [string] message of the error

  returns: 
    [Error]   
*/
var createError = function(name, message) {
  var error = new Error(name);
  error.message = message;
  return error;
};


// initial the module with the given parameters.
var _init = function(secretKey, algorithm) {
  // set the attributes
  _secretKey = secretKey;
  _algorithm = algorithm || DEFAULT_ALGORITHM;

  // check the valid attributes
  if (!isValidSecretKey(_secretKey))
    throw createError(TokenGenerator.ERRORS.SECRET_KEY, 'Given secret key is not valid.');

  if (!isValidAlgorithm(_algorithm))
    throw createError(TokenGenerator.ERRORS.ALGORITHM, 'Given algorithm is not valid.');

  _inited = true;
}

/* 
  [public method]
  Generate new random token acording to the secretKey.

  returns: 
    [string]: new generated token.
*/
var _generateToken = function() {
  if (!isInited())
    throw createError(_ERRORS.NOT_INITED);

  var jwtOptions = {
    algorithm: _algorithm
  };

  var randomNumber = Date.now() + '.' + Date.now() + '.' + Math.random() + '-.-' + Math.random();
  var nextRandomNumber = Date.now() + '.' + Date.now() + '.' + Math.random() + '-.-' + Math.random();

  object = {
    rn: randomNumber,
    rn2: nextRandomNumber
  };

  jwtToken = jwt.sign(object, _secretKey, jwtOptions);
  return jwtToken;
}

/* 
  [public method]
  verify the given token acording to the secretKey.

  params: 
    token: [string] the token to verify.

  returns: 
    [boolean]
      true: token is verified.
      false: token is not verified.
*/
var _isValidToken = function(token) {
  if (!isInited())
    throw createError(_ERRORS.NOT_INITED)

  try {
    var jwtOptions = {
      algorithm: _algorithm
    };

    var decoded = jwt.verify(token, _secretKey);

    if (object.rn && object.rn2)
      return true;

  } catch (error) {}

  return false;
}

/*

*/
var _ERRORS = {
  ALGORITHM: 'BAD_ALGORITHM',
  SECRET_KEY: 'BAD_SECRET_KEY',
  NOT_INITED: 'NOT_INITED'
};

/*
  [public singleton class]
  TokenGenerator to create random token and verify the given token.
*/
var TokenGenerator = {
  init: _init,
  generateToken: _generateToken,
  isValidToken: _isValidToken,
  ERRORS: _ERRORS
}

exports = module.exports = TokenGenerator;