var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt
var User = require('../../models/customers/customerModel')
var config = require('../jwt')

module.exports = function (passport) {
  var opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt')
  opts.secretOrKey = config.secret
  opts.signOptions = config.signOptions
  passport.use(new JwtStrategy(opts, function (jwt_payload, done) {

    if (jwt_payload.u_id == null) {
      done(null, true)
    } else {
      User.findOne({ u_id: jwt_payload.u_id }, function (err, user) {
        if (err) {
          return done(err, false)
        }
        if (user) {
          done(null, user)
        } else {
          done(null, false)
        }
      })
    }
  }))
}
