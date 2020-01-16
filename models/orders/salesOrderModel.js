var mongoose = require('mongoose')
var Schema = mongoose.Schema

var salesOrderSchema = new Schema({
  u_id: { type: String, required: true },
  product_order: { type: Object, required: true },
  vendor_id: String,
  product_offers: String,
  order_number: { type: Number, unique: true, required: true },
  snap_token: { type: String },
  payment_number: { type: String, unique: true, required: true },
  customer_firstname: { type: String, required: true },
  customer_lastname: { type: String, required: true },
  customer_address: { type: String, required: true },
  customer_city: { type: String, required: true },
  customer_province: { type: String, required: true },
  customer_country: { type: String, required: true },
  customer_phone: { type: String, required: true },
  customer_email: { type: String, required: true },
  point: Number,
  base_subtotal: { type: Number, required: true },
  base_discount: Number,
  base_tax: Number,
  base_grandtotal: { type: Number, required: true },
  global_rate: { type: Number, required: true },
  total_due: { type: Number, required: true },
  payment_method: { type: String, required: true },
  order_status: { type: String, required: true },
  refunded: Number,
  total_refunded: Number,
  limit_payment: Date,
  created_at: { type: Date },
  update_at: { type: Date, $currentDate: { time: true } },
  status: { type: Number, required: true },
  approvement: { type: Number, required: true }
})

salesOrderSchema.pre('save', function (next) {
  return next()
})

module.exports = mongoose.model('salesorders', salesOrderSchema)
