var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
  u_id: {
    type: String,
    unique: false,
    required: true
  },
  jwt_token: {
    type: String,
    unique: true,
    required: true
  },
  is_blacklist: {
    type: String,
    unique: false,
    required: true
  }
})

UserSchema.pre('save', function (next) {
  return next()
})

module.exports = mongoose.model('Session', UserSchema)
