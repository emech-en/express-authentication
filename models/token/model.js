var configs = require('./../../lib/configs');
var TokenGenerator = require('./../../lib/token-generator');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');

// default collection name
var COLLECTION_NAME = 'tokens';

/*
  CREATE SCHEMA
*/
// load schema defenition 
var schemaDef = require('./schema');
// create schema Object
var tokenSchema = new Schema(schemaDef);

/*
  FUNCTION DEFINITION
*/
/*
  [public hook method]

  Check if token is new, generate a new random token 
  according to configs.secretKey and set the expiration time
*/
var preSave = function(next) {
  return next();
};

/*
  [public static function]
  Find the token object by given token.

  params:
    token: [string] a token to query.
    callback: [function(error, token)]

  return:
    [Token.findOne()]
*/
var findByToken = function(token, projection, options, callback) {
  var query = {
    token: token
  }
  return Token.findOne(query, projection, options, callback)
};

/*
  [public static function]
  Find the tokens object by given userkey.

  params:
    userKey: [string] the userKey to query.
    callback: [function(error, tokens)]

  return:
    [Token.find()]
*/
var findByUserKey = function(userKey, projection, options, callback) {
  var query = {
    userKey: userKey
  }
  return Token.find(query, projection, options, callback)
};

/*
  [public static function]
  Revoke all of user's tokens.

  params:
    userKey: [string] a token to query.
    callback: [function(error)]

  return:
    [async.each]
*/
var revokeByUserKey = function(userKey, callback) {
  projection = {
    isRevoked: true
  }

  Token.findByUserKey(userKey, projection, function(error, tokens) {
    if (error)
      return callback(error)

    return async.each(tokens, revokeToken, callback)
  })
};

/*
  [public static function]
  Revoke a token by the token.

  params:
    token: [string] a token to revoke.
    callback: [function(error)]

  return:
    [token.revoke()]
*/
var revokeByToken = function(token, callback) {
  projection = {
    isRevoked: true
  }

  Token.findByToken(token, projection, function(error, token) {
    if (error)
      return callback(error)

    if (!token)
      return callback()

    return token.revoke(callback)
  })
};

/*
  [public static function]
  Create a new token object according to given infos.
  If revokeOthers is true then revoke all the other tokens of the 
  userKey and then create a new one.

  params:
    userKey: [string],
    roles: [Array[string]] roles of the user
    info: [object] infromation object to save
    revokeOthers: [boolean] if true revoke all other tokens of the userKey
    callback: [function(error, token.token)]

  returns: 
    [async.waterfall]
 */
var createToken = function(token, userKey, roles, info, expirationTime, revokeOthers, callback) {

  // if revokeOthers revoke all the other tokens
  var revoke = function(callback) {
    if (revokeOthers)
      return Token.revokeByUserKey(userKey, callback);

    return callback();
  };

  // create and save new token
  var saveNewToken = function(callback) {
    var newToken = new Token({
      token: token,
      userKey: userKey,
      roles: roles,
      info: info
    });

    return newToken.extendExpirationTime(expirationTime, function(error, savedToken) {
      if (error)
        return callback(error);

      return callback(null, savedToken);
    });
  }

  // run the workflow
  return async.waterfall([revoke, saveNewToken], callback);
};

/*
  [public method]
  Extends the token expiration time according to configs.getExpirationTime().
  if callback is present, save the token and then run the callback.

  params:
    time: times to extend expiration time.
    callback: [function(error, token)]

  return:
    [token.save()]
*/
var extendExpirationTime = function(time, callback) {
  this.expireAt = this.expireAt.getTime() + time;
  if (callback)
    return this.save(callback);
};

/*
  [public method]
  Check the token expireAt time.

  return:
    [boolean] true if is expired,
              and false if is not expired.
*/
var isExpired = function() {
  return Date.now() > this.expireAt;
};

/*
  [public method]
  Revoke the token by setting the isRevoked true.
  If callback is presented save the token object witch the callback.

  params:
    callback: [function(error, token)]

  return:
    [token.save()]
*/
var revoke = function(callback) {
  this.isRevoked = true;
  if (callback)
    return this.save(callback);
};

/*
  [private static method]
  Revoke the given token with the callback.

  params:
    callback: [function(error, token)]

  return:
    [token.revoke()]
*/
var revokeToken = function(token, callback) {
  return token.revoke(callback);
};

/*
  CONFIGURE SCHEMA
*/
// set hooks
tokenSchema.pre('save', preSave);
// set methods
tokenSchema.methods.extendExpirationTime = extendExpirationTime;
tokenSchema.methods.isExpired = isExpired;
tokenSchema.methods.revoke = revoke;
// set static functions
tokenSchema.statics.findByToken = findByToken;
tokenSchema.statics.findByUserKey = findByUserKey;
tokenSchema.statics.revokeByToken = revokeByToken;
tokenSchema.statics.revokeByUserKey = revokeByUserKey;
tokenSchema.statics.createToken = createToken;

/*
  Create and return Model
*/
var Token = mongoose.model('token', tokenSchema, configs.getCollectionName() || COLLECTION_NAME);
module.exports = Token;