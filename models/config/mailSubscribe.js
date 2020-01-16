var mongoose = require("mongoose")
var Schema = mongoose.Schema

var MailSchema = new Schema({
    fullname: { type: String, unique: false, required: true },
    email: { type: String, unique: true, required: true },
    sub_date: Date,
    status: Number
})

MailSchema.pre("save", function(next) {
    return next()
})

module.exports = mongoose.model("mailSubscribe", MailSchema)
