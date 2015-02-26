var jwt = require('jsonwebtoken');

var DEFAULT_ALGORITHM = 'RS256';
var VALID_ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];

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

  return true;
};

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

/*
  [public class]
  TokenGenerator to create random token and verify the given token.

  ERRORS: 

*/
var TokenGenerator = function(secretKey, algorithm) {

  /*
    [private field] 
    The secret key to sign the token
  */
  this._secretKey = secretKey;

  /*
    [private field] 
    The algorithm of the siging token
  */
  this._algorithm = algorithm || DEFAULT_ALGORITHM;


  // checj the algorithm
  if (!isValidAlgorithm(this._algorithm))
    throw createError(TokenGenerator.ERRORS.ALGORITHM, 'Given algorithm is not valid.');

  // check the secret key
  if (!isValidSecretKey(this._secretKey))
    throw createError(TokenGenerator.ERRORS.SECRET_KEY, 'Given secretKey is not valid.');

  /* 
    [public method]
    Generate new random token acording to the secretKey.

    returns: 
      [string]: new generated token.
  */
  this.generateToken = function() {
    var jwtOptions = {
      algorithm: this._algorithm
    };

    var randomNumber = Math.random() + '-.-' + Math.random();
    var nextRandomNumber = Math.random() + '.-.' + Math.random();

    object = {
      rn: randomNumber,
      rn2: nextRandomNumber
    };

    jwtToken = jwt.sign(object, this._secretKey, jwtOptions);
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
  this.isVlaidToken = function(token) {
    try {
      var decoded = jwt.verify(token, this._secretKey);

      if (object.rn && object.rn2)
        return true;

    } catch (error) {}

    return false;
  }
}

Token.ERRORS = {
  ALGORITHM: 'BAD_ALGORITHM',
  SECRET_KEY: 'BAD_SECRET_KEY'
};

exports = module.exports = Token;