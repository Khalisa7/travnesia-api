var mongoose = require('mongoose')
var Schema = mongoose.Schema

var eventsSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    slug : {
        type : String,
        required : true
    },
    description : String,
    location : {
        type : String,
        required : true
    },
    lowerprice : {
        type : Number,
        required : true
    },
    image : String,
    vendor_id : {
        type : String,
        required : true
    }
})

eventsSchema.pre('save', function (next){
    return next()
})

module.exports = mongoose.model('Events',eventsSchema)