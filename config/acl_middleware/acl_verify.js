const jwt = require('../jwt_middleware/jwt.js')
const code = require('./../jwt_middleware/errorCode.json')
const Response = require('../../common/response')

const isUser = function (req, res, next) {
    let token = jwt.decode(jwt.getToken(req.headers)) || null
    let type =  token.payload.type
    if(type === 'user' && token !== null){
        next()
    } else if(token == null) {
        Response.error('No Authorization Mode', res, {flag: code.header_no_token})
    }else{
        Response.unauthorized('Unauthorized, Please Log In as Customer', res, {flag: code.unsupported_auth_token})
    }
}

const isVendor = function (req, res, next) {
    let token = jwt.decode(jwt.getToken(req.headers)) || null
    let type =  token.payload.type

    if(type === 'partner' && token !== null){
        next()
    } else if(token == null) {
        Response.error('No Authorization Mode', res, {flag: code.header_no_token})
    }else{
        Response.unauthorized('Unauthorized, Please Log In as Vendor', res, {flag: code.unsupported_auth_token})
    }
}


module.exports = {
    isUser, isVendor
}