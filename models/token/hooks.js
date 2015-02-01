var jwt = require('jsonwebtoken')

var SECRET = "HEY ASS HOLE!"
module.exports.init = init
module.eports.preSave = preSave

function init = function(configs) {
  configs = configs || {}
  SECRET = configs.secret || SECRET  
}

function preSave = function(next) {
  if (this.isNew) {
    this.token = generateRandomToken(this)
    this.extendExpirationTime()
  }

  return next()
}

function generateRandomToken(token) {
  var payload = {
    userKey: token.userKey,
    roles: token.roles,
    random: Date.now() + '' + Math.random()
  }
  var token = jwt.sign(payload, SECRET)
  return token
}