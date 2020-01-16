var mongoose = require('mongoose')
var Schema = mongoose.Schema

var SlidesSchema = new Schema({
    slide_id: { type: String, unique: true, required: true},
    name: { type: String, required: true},
    redirect: {type: String},
    short_desc: {type: String, max: 100},
    description:{type: String},
    order: Number,
    start_date: {type: Date, required: true},
    end_date: {type: Date, required: true},
    image: {type: String},
    published_at: { type: Date, $currentDate: { time: true } },
    update_at: { type: Date, $currentDate: { time: true } },
    status: Number

})

SlidesSchema.pre('save', function (next) {
    return next()
  })

module.exports = mongoose.model('slides', SlidesSchema)
