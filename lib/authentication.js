var mongoose = reuqire('mongoose')

var models = require('./../model/')
var Token = models.Token

var utils = require('./utils')

// tokenPlace wich authentication token should be
var tokenPlace

// name of the authentication token param
var tokenName

// default options
var defaults = {
  mongoose: {
    uri: 'mongodb://localhost:27017/authentication'
  },
  redis: {

  },
  tokenPlace: 'query',
  tokenName: 'token'
}


/*
  Initial the module according to the given options.
  
  params: 
    options: [object] (optional) object that contains the options 
  
  returns:
    [express middleware] that check the request and if
    a valid token presented load user info in the request
*/
module.exports.init = function(options) {
  options = options || {}

  var mongooseOptions = options.mongoose || defaults.mongoose
  mongoose.connect(mongooseOptions.uri, mongooseOptions.options)

  tokenPlace = options.tokenPlace || defaults.tokenPlace
  tokenName = options.tokenName || defaults.tokenName

  if (['query', 'cookies', 'body'].indexOf(tokenPlace) === -1)
    throw new Error('Invalid tokenPlace option')

  if (typeof tokenName !== 'string')
    throw new Error('Authentication tokenName should be string')

  if (tokenPlace === 'cookies')
    console.warn('You should use cookieParser middleware before init authentication module.')

  if (tokenPlace === 'body')
    console.warn('You should use bodyParser middleware before init authentication module.')

  return function(req, res, next) {
    var tokenPlace = req[tokenPlace]
    if (!tokenPlace)
      return next()

    var token = tokenPlace[tokenName]
    if (!token)
      return next()

    if (!utils.validateToken(token))
      return next()

    Token.findByToken(token, function(error, result) {
      if (error)
        return next(error)

      else if (!result)
        return next()

      if (result.expireAt - Date.now() < 300000) {
        result.expireAt = result.expireAt + 1200000
        result.save(function(error, token) {
          if (error)
            console.warn(error)
        })
      }

      req.authentication = {
        token: token,
        expireAt: result.expireAt,
        user: result.info,
        roles: result.roles,
        userKey: result.userKey
      }
      return next()
    })
  }
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
  var token = new Token({
    userKey: userKey,
    roles: roles,
    info: info
  })

  token.save(function(error, token) {
    if (error)
      return callback(error)

    return callback(null, token.token)
  })
}

/*
  Expire the token and logout the user.

  params: 
    revoke: [boolean] true if want to revoke all other tokens of the user

  returns: 
    [express middleware] log out the user, and call the next middleware.
*/
module.exports.logout = function(revoke) {
  return function(req, res, next) {
    function callback(error) {
      return next(error)
    }

    if (!req.authentication)
      return next()

    if (!req.authentication.token)
      return next()

    if (!req.authentication.userKey)
      return next()

    if (revoke)
      return Token.expireByUserKey(req.authentication.userKey, callback)
    else
      return Token.expireByToken(req.authentication.token, callback)
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
  return Token.expireByUserKey(userKey, callback)
}

/*
  Check the authorization of the user.

  params:
    roles: [Array[string]] roles is authorized for the action.

  returns: 
    [express middleware] that checks the user roles and if authorized, pass for next middleware
    and if not, return and authorization error 
*/
module.exports.authorize = function(roles) {
  if (!(roles instanceof Array))
    roles = [roles]

  for (var i = 0; i < roles.length; i++)
    roles[i] = utils.parseRole(roles[i])

  return function(req, res, next) {
    if (!req.authentication) {
      var error = new Error('Unauthorized')
      error.status = 401
      error.message = 'You need authentication for the current request'
      return next(error)
    }

    function generateComplexRole(role, callback) {
      if (typeof role === 'string')
        return callback(null, role)

      if (typeof role !== 'object')
        return callback(new Error('Role is not valid'))

      if (!role.role)
        return callback(new Error('Role is not valid'))

      if (role.query)
        return callback(null, role.role + req.query[role.query])

      if (role.param)
        return callback(null, role.role + req.params[role.param])

      return callback(new Error('Role is not valid'))
    }

    function checkUserRoles(role, callback) {
      if (typeof req.authentication.roles === 'string')
        return callback(role === req.authentication.roles)

      if (req.authentication.roles instanceof Array)
        return callback(req.authentication.roles.indexOf(role) > -1)

      return callback(false)
    }

    async.map(roles, generateComplexRole, function(error, roles) {
      if (error)
        return next(error)

      return async.some(roles, checkUserRoles, function(authorized) {
        if (authorized)
          return next()

        var error = new Error('Forbidden')
        error.status = 403
        error.message = 'You are not allowed for the request'
        return next(error)
      })
    })
  }
}