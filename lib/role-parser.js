var OPEN_TAG = '{{';
var CLOSE_TAG = '}}';
var TYPE_PARAM = ':';
var TYPE_QUERY = '?';


/*
	Parse the given role acording to req object.
	{{:paramName}} -> req.params.paramName
	{{?paramName}} -> req.query.paramName
*/
module.exports.parseRole = function(role, req) {
  if (!role || typeof role !== 'string')
    return role;

  var openIndex = role.indexOf(OPEN_TAG);
  if (openIndex < 0)
    return role;

  var closeIndex = role.indexOf(CLOSE_TAG);
  if (closeIndex < 0 || closeIndex < openIndex)
    return role;

  var param = role.substring(openIndex + 2, closeIndex);
  var paramName = param.substring(1);
  if (param[0] === TYPE_PARAM)
    return role.replace(OPEN_TAG + param + CLOSE_TAG, req.params[paramName]);
  if (param[0] === TYPE_QUERY)
    return role.replace(OPEN_TAG + param + CLOSE_TAG, req.query[paramName]);

  return role
}