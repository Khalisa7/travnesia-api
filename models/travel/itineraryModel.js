const mongoose = require('mongoose')
const Schema = mongoose.Schema

var ItenerarySchema = new Schema({
    parent_id: { type: String, required: true },
    day: { type: Number },
    slug: { type: String },
    description: String,
    updated_at: { type: Date },
    created_at: { type: Date }
})

module.exports = mongoose.model('itinerary', ItenerarySchema, 'itinerary')