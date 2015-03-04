var async = require('async');

var configs = require('./configs');
var tokenGenerator = require('./token-generator');
var roleParser = require('./role-parser');

// 10 minutes default expiration time.
var DEFAULT_EXPIRATION_TIME = 10 * 60 * 1000;
var DEFAULT_TOKEN_PLACE = 'query';
var DEFAULT_TOKEN_NAME = 'token';

// token Model Object
var Token;

// place where should token be
var tokenPlace;

// name of the token variable in req[tokenPlace]
var tokenName;

// token expiration time
var expirationTime;

/*
  Configure the module according to the given options.
  
  params: 
    options: [object] (optional) object that contains the options 
  
  returns:
    [nothing]
*/
module.exports.init = function(options) {
  // init the configs module
  configs.init(options);

  // load models
  var models = require('./../models/');
  Token = models.Token;

  // load token place
  tokenPlace = configs.getTokenPlace() || DEFAULT_TOKEN_PLACE;

  // load token name
  tokenName = configs.getTokenName() || DEFAULT_TOKEN_NAME;

  // load expiration time
  expirationTime = configs.getExpirationTime() || DEFAULT_EXPIRATION_TIME;
}


/*
  authentication middleware, read the token from request and 
  if valid load token info from database. and create the 
    req.authentication = {
      token: token,
      expireAt: result.expireAt,
      user: result.info,
      roles: result.roles,
      userKey: result.userKey
    }
  opject and then call the next middleware.
  
  params: 
    options: [object] (optional) object that contains the options 
  
  returns:
    [express middleware] that check the request and if
    a valid token presented load user info in the request
*/
module.exports.authenticate = function(req, res, next) {
  var place = req[tokenPlace];
  if (!place)
    return next();

  var token = place[tokenName];
  if (!token)
    return next();

  if (!tokenGenerator.isValidToken(token))
    return next();

  Token.findByToken(token, function(error, token) {
    if (error)
      return next(error);

    if (!token)
      return next();

    if (token.isRevoked)
      return next(getAuthenticationError());

    if (token.isExpired())
      return next(getExpiredTokenError());

    if (token.expireAt - Date.now() < 300000)
      token.extendExpirationTime(expirationTime, function(error, token) {
        if (error)
          console.warn(error);
      });


    req.authentication = {
      token: token.token,
      expireAt: token.expireAt,
      user: token.info,
      roles: token.roles,
      userKey: token.userKey
    };
    return next();
  })
}

/*
  Generate a token for the user. 
  
  params: 
    userKey: [string] a unique key for the user
    roles: [Array[string]] roles of the user need for authorization
    info: [object] application spec information of the user
    revokeOther: [boolean] true if want to revoke all other tokens of the user
    callback: [function(error, token)]

  returns:
    [nothing]
*/
module.exports.login = function(userKey, roles, info, revokeOther, callback) {
  // create token Object
  var token = tokenGenerator.generateToken();

  if (!callback) {
    callback = revokeOther;
    revokeOther = false;
  }

  if (!callback) {
    callback = info;
    info = null;
  }

  return Token.createToken(token, userKey, roles, info, expirationTime, revokeOther, callback);
}

/*
  Expire the token and logout the user.

  params: 
    revokeAll: [boolean] true if want to revoke all other tokens of the user

  returns: 
    [express middleware] log out the user, and call the next middleware.
*/
module.exports.logout = function(revokeAll) {
  return function(req, res, next) {
    if (!req.authentication)
      return next();

    if (!req.authentication.token)
      return next();

    if (!req.authentication.userKey)
      return next();

    var token = req.authentication.token;
    var userKey = req.authentication.userKey;
    req.authentication = null;

    if (revokeAll)
      return Token.revokeByUserKey(userKey, next);

    return Token.revokeByToken(token, next);
  }
}

/*
  Revoke all the token of the given userKey.

  params: 
    userKey: [string] the key of the user
    callback: [function(error)]

  returns:
    [nothing]
*/
module.exports.revoke = function(userKey, callback) {
  return Token.revokeByUserKey(userKey, callback)
}

/*
  Check the authorization of the user.

  params:
    requiredRoles:  [Array[string]] roles is authorized for the action. 
                    a role can be simple like "manager".
                    or can be complex like "manager-at-{{:businessId}}"
                      where :businessId is the parametr of the request.
                    or like "manager-at-{{?businessId}}"
                      where ?businessId is the query of the request.

  returns: 
    [express middleware] that checks the user roles and if authorized, pass for next middleware
    and if not, return and authorization error 
*/
module.exports.authorize = function(requiredRoles) {
  if (!(requiredRoles instanceof Array))
    requiredRoles = [requiredRoles];

  return function(req, res, next) {
    if (!req.authentication)
      return next(getAuthenticationError());

    var userRoles = req.authentication.roles;
    if (!(userRoles instanceof Array))
      userRoles = [userRoles];

    function checkUserRoles(requiredRole, callback) {
      requiredRole = roleParser.parseRole(requiredRole, req);

      return callback(userRoles.indexOf(requiredRole) > -1);
    }

    return async.some(requiredRoles, checkUserRoles, function(authorized) {
      if (authorized)
        return next();

      return next(getAuthorizationError());
    })
  }
}

function getAuthorizationError() {
  var error = new Error('Forbidden');
  error.status = 403;
  error.details = 'You are not allowed for the request';
  return error;
}

function getExpiredTokenError() {
  var error = new Error('Authentication Timeout');
  error.status = 419;
  error.details = 'Token has been expired';
  return error;
}

function getAuthenticationError() {
  var error = new Error('Unauthorized');
  error.status = 401;
  error.details = 'You need authentication for the current request';
  return error;
}