module.exports.validateToken = function(token) {
  if (!token)
    return false

  return true
}

module.exports.generateToken = function() {
  return Math.random()
}

module.exports.parseRole = function(role) {
  if (typeof role !== 'string')
    throw new Error('role should be string')

  var indexOfColon = role.indexOf(':')
  var indexOfParam = indexOfColon + 1
  var paramName = ''
  if (indexOfColon > 0 && indexOfColon < role.length)
    return {
      role: role.substring(0, indexOfColon)
      param: role.substring(indexOfParam)
    }

  var indexOfQuestionMark = role.indexOf('?')
  var indexOfQuery = indexOfQuestionMark + 1
  var queryName = ''
  if (indexOfQuery > 0 && indexOfQuery < role.length)
    return {
      role: role.substring(0, indexOfQuestionMark)
      query: role.substring(indexOfQuery)
    }

  return role
}