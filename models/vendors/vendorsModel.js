var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt = require('bcrypt-nodejs')

var VendorSchema = new Schema({
  vendor_id: { type: String, unique: true, required: true },
  company_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: String,
  avatar: String,
  phone: { type: String, minlength: 9, maxlength: 15 },
  address: String,
  city: String,
  province: String,
  postal_code: { type: Number, minlength: 3, maxlength: 10 },
  hash: String,
  is_verified: { type: Number },
  created_at: { type: String, required: true },
  last_login: { type: String },
  update_at: { type: String },
  status: { type: Number, required: true }
})

VendorSchema.pre('save', function (next) {
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

VendorSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb(err)
    }
    cb(null, isMatch)
  })
}

module.exports = mongoose.model('vendors', VendorSchema)
