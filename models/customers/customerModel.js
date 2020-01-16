var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt = require('bcrypt-nodejs')

var userSchema = new Schema({
  u_id: { type: String, unique: true, required: true },
  u_group: { type: Number, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: String,
  avatar: String,
  phone: { type: Number, min: 9, max: 15 },
  address: String,
  city: String,
  province: String,
  postal_code: { type: Number, min: 3, max: 10 },
  is_verified: { type: Number },
  hash: { type: String },
  point: Number,
  reg_date: { type: Date, required: true },
  last_login: { type: Date, $currentDate: { time: true } },
  update_at: { type: Date, $currentDate: { time: true } },
  status: { type: Number, required: true }
})

userSchema.pre('save', function (next) {
  var user = this
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err)
      }
      bcrypt.hash(user.password, salt, null, function (err, hash) {
        if (err) {
          return next(err)
        }
        user.password = hash
        next()
      })
    })
  } else {
    return next()
  }
})

userSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb(err)
    }
    cb(null, isMatch)
  })
}

module.exports = mongoose.model('customers', userSchema)
