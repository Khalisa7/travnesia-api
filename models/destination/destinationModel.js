var mongoose = require('mongoose')
var Schema = mongoose.Schema

var DestinationSchema = new Schema({
  destination_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  hits: Number,
  featured: String,
  created_at: { type: Date, $currentDate: { time: true } },
  update_at: { type: Date, $currentDate: { time: true } }
})

module.exports = mongoose.model('Destinations', DestinationSchema)
