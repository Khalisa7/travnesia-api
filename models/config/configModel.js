var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
  name: String,
  path: String,
  value: String,
  published_at: Date,
  updated_at: Date,
  updated_by: Date,
  status: Number
})

UserSchema.pre('save', function (next) {
  return next()
})

module.exports = mongoose.model('appConfig', UserSchema)
