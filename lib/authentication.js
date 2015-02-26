var configs = require('./configs');
var TokenGenerator = require('./token-generator');
var roleParser = require('./role-parser');

// token Model Object
var Token;

// place where should token be
var tokenPlace;

// name of the token variable in req[tokenPlace]
var tokenName;

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
  var models = require('./../model/');
  Token = models.Token;

  // load token configs
  tokenPlace = configs.getTokenPlace();
  tokenName = configs.getTokenName();
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
  var tokenPlace = req[tokenPlace];
  if (!tokenPlace)
    return next();

  var token = tokenPlace[tokenName];
  if (!token)
    return next();

  var tokenGenerator = new TokenGenerator(configs.secretKey);
  if (!tokenGenerator.isVlaidToken(token))
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
      token.extendExpirationTime(function(error, token) {
        if (error)
          console.warn(error);
      })

    req.authentication = {
      token: token,
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
  return Token.generateToken(userKey, roles, info, revokeOther, callback)
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

    if (revokeAll)
      return Token.revokeByUserKey(req.authentication.userKey, next);

    return Token.revokeByToken(req.authentication.token, next);
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

    return async.some(roles, checkUserRoles, function(authorized) {
      if (authorized)
        return next();

      return next(getAuthorizationError());
    })
  }
}

function getAuthorizationError() {
  var error = new Error('Forbidden');
  error.status = 403;
  error.message = 'You are not allowed for the request';
}

function getExpiredTokenError() {
  var error = new Error('Authentication Timeout');
  error.status = 419;
  error.message = 'Token has been expired';
}

function getAuthenticationError() {
  var error = new Error('Unauthorized');
  error.status = 401;
  error.message = 'You need authentication for the current request';
}