var mongoose = require('mongoose')
var Schema = mongoose.Schema

var PackageSchema = new Schema({
  product_id: { type: String, required: true },
  vendor_id: { type: String, required: true },
  image: String,
  destination: { type: String, required: true },
  duration: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  id_shortdesc: { type: String, required: true },
  id_desc: { type: String, required: true },
  base_price: { type: Number, required: true },
  facility: String,
  slug: { type: String, required: true },
  qty_minimum_booking: Number,
  stock: Number,
  guarantee: String,
  pickup_location: String,
  open_date_start: Date,
  open_date_end: Date,
  open_date: Number,
  sku: String,
  hits: Number,
  point: Number,
  created_at: Date,
  published_at: Date,
  status: Number
})

module.exports = mongoose.model('Packages', PackageSchema)
