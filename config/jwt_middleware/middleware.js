var jwtCheck = require('./jwt')
var Response = require('./../../common/response')
var code = require('./errorCode.json')
/**
 * Validate JSON Token.
 * @param {object} req
 * @return json response
 * @public
 */
var validateToken = function (req, res, next) {
    var tokenHeader = req.headers['authorization']
    if (tokenHeader) {
        var bearerCheck = tokenHeader.search("Bearer");
        var token = tokenHeader.replace('Bearer ', '')
        if (bearerCheck !== 0 || !tokenHeader) {
            Response.unauthorized("Unauthorized. An suspicious request has been logged.", res, code.header_no_token)
        } else {
            var validation = jwtCheck.verify(token)
            if (validation) {
                next()
            } else {
                Response.unauthorized("Unauthorized. An suspicious request has been logged.", res, code.token_expired)
            }
        }
    } else {
        Response.error("Bad Request", res, code.unsupported_auth_token)
    }
}

module.exports =
    validateToken

