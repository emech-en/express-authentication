EXPIRATION_OFFSET = 600000
module.exports.init = function(configs) {
  configs = configs || {}
  EXPIRATION_OFFSET = configs.expirationOffset || EXPIRATION_OFFSET
}

module.exports.extendExpirationTime = function() {
  this.expireAt = this.expireAt.getTime() + EXPIRATION_OFFSET
}