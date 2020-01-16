const fs = require('fs');
const jwt = require('jsonwebtoken');
var Response = require("./../../common/response")

// use 'utf8' to get string instead of byte array  (512 bit key)
var privateKEY = fs.readFileSync(__dirname + '/key/private.key', 'utf8');
var publicKEY = fs.readFileSync(__dirname + '/key/public.key', 'utf8');

module.exports = {
	sign: (payload) => {

		// Token signing options
		var signOptions = {
			issuer: 'visitor',
			subject: 'visitor',
			audience: 'visitor',
			expiresIn: "12H",    // 30 days validity
			algorithm: "RS256"
		};
		return jwt.sign(payload, privateKEY, signOptions);
	},

	verify: (token) => {

		var verifyOptions = {
			issuer: 'visitor',
			subject: 'visitor',
			audience: 'visitor',
			expiresIn: "12H",    // 30 days validity
			algorithm: "RS256"
		};

		try {
			return jwt.verify(token, publicKEY, verifyOptions);
		} catch (err) {
			return false
		}
	},

	decode: (token) => {
		return jwt.decode(token, { complete: true });
	},

	getToken: (headers) => {
		if (!headers) {
			return false
		} else if (headers && headers.authorization) {
			var parted = headers.authorization.split(' ')
			if (parted.length === 2) {
				return parted[1]
			} else {
				return null
			}
		} else {
			return null
		}
	},

	validateToken: function (req) {
		var tokenHeader = req.headers['authorization']
		var bearerCheck = tokenHeader.search("Bearer");
		var token = tokenHeader.replace('Bearer ', '')
		if (bearerCheck !== 0 || !tokenHeader) {
			Response.unauthorized("Unauthorized. An suspicious request has been logged [1].", res, {})
		} else {
			var validation = jwtCheck.verify(token)
			if (validation) {
				next()
			} else {
				Response.unauthorized("Unauthorized. An suspicious request has been logged [2].", res, {})
			}
		}
	}

}