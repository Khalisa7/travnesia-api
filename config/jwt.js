var fs = require("fs")

var publicKey = fs.readFileSync(__dirname + '/jwt_middleware/key/public.key', 'utf8');
var privateKey = fs.readFileSync(__dirname + '/jwt_middleware/key/private.key', 'utf8');

var signOptions = {
  issuer: "Teras Code Digital",
  subject: "token",
  audience: "users",
  expiresIn: "12h",
  algorithm: "RS256"
};

module.exports = {
  secret: publicKey,
  privateKey: privateKey,
  signOptions: signOptions
}
