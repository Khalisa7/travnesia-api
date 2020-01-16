var mongoose = require('mongoose')
var Schema = mongoose.Schema

var PaymentSchema = new Schema({
   order_number :{ type: String, unique: true, required: true},
   payment_number:  { type: String, unique: true, required: true},
   customer_firstname : { type : String},
   customer_lastname : { type : String},
   customer_address : { type : String},
   customer_city : { type : String},
   customer_province : { type : String},
   customer_country : { type : String},
   customer_phone : { type : String},
   customer_email : { type : String},
   base_subtotal : {type : Number},
   base_discouunt : {type : Number},
   base_tax     : { type : Number},
   base_grandtotal : { type : Number},
   global_rate : {type : Number},
   total_due : { type : Number},
   payment_method : { type : String},
   order_status : { type : String},
   refunded : { type : Number},
   total_refunded : { type : Number},
   status : { type : Number}
}) 

module.exports = mongoose.model('salesorders', PaymentSchema)