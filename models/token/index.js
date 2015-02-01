var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Types = mongoose.Types

var EXPIRATION_OFFSET = 600000
var SECRET_KEY = 'this is my secret key, fuck you ass hole! '
var COLLECTION_NAME = 'tokens'

var schema = require('./schema')
var methods = require('./methods')
var statics = require('./statics')
var hooks = require('./hooks')


var tokenSchema = new Schema(schema)

tokenSchema.pre('save', hooks.preSave)

tokenSchema.methods.extendExpirationTime = methods.extendExpirationTime

var Token = mongoose.model('token', tokenSchema, COLLECTION_NAME)

module.exports = {
  init: function(configs) {
    EXPIRATION_OFFSET = configs.expirationOffset || EXPIRATION_OFFSET
    COLLECTION_NAME = configs.collectionName || COLLECTION_NAME
    SECRET_KEY = configs.secretKey || SECRET_KEY

    methods.init({
      expirationOffset: EXPIRATION_OFFSET
    })
    hooks.init({
      secretKey: SECRET_KEY
    })
    statics.init({})
  },
  model: Token
}