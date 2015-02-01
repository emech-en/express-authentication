var jwt = require('jsonwebtoken')
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Types = mongoose.Types

var COLLECTION_NAME = 'tokens';

var tokenSchema = new Schema({
  // generated tokenId string
  token: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  // creation date time of the token
  loginAt: {
    type: Date,
    default: Date.now
  },
  // expiration date time of the token
  expireAt: {
    type: Date,
    default: getExpirationTime,
    index: true
  },
  // a key for eachUser
  userKey: {
    type: String,
    index: true,
    required: true
  },
  // any application information wich is considered to save
  // and retrived from token
  info: {},
  // roles of the user
  roles: {
    type: [String],
    required: true
  }
})

tokenSchema.pre('save', function(next) {
  if (this.isNew)
    this.token = generateRandomToken(this)

  return next()
})
tokenSchema.methods.extendExpirationTime = extendExpirationTime

var Token = module.exports = mongoose.model('token', tokenSchema, COLLECTION_NAME)


var EXPIRATION_OFFSET = 600000

function getExpirationTime() {
  return Date.now() + EXPIRATION_OFFSET
}

function extendExpirationTime() {
  this.expireAt = this.expireAt.getTime() + EXPIRATION_OFFSET
}

function generateRandomToken(token) {
  var payload = {
    userKey: token.userKey,
    roles: token.roles,
    random: Date.now() + '' + Math.random()
  }
  var token = jwt.sign(payload, 'fuck you this is my secret')
  return token
}