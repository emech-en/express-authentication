var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Types = mongoose.Types

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
    default: Date.now
    index: true
  },
  // shows that token has been revoked or not
  isRevoked: {
    type: Boolean,
    default: false
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


module.exports = tokenSchema;