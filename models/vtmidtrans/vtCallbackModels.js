var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
	transaction_time: { type: String, required: true },
	transaction_status: { type: String, required: true },
	transaction_id: { type: String, required: true },
	transaction_message: { type: String },
	status_code: { type: String, required: true },
	signature_key: { type: String, required: true },
	payment_type: { type: String, required: true },
	order_id: { type: String, required: true },
	fraud_status: { type: String },
	channel_response_message: { type: String },
	channel_response_code: { type: String },
	card_type: { type: String },
	va_numbers: { type: Object },
	bank: { type: String },
	approval_code: { type:String },
	masked_card: { type: String },
	biller_code: { type: String },
	biller_key: { type: String },
	gross_amount: { type: String, required: true },
	payment_amounts: { type:String },
	origin: { type: String }
})

UserSchema.pre('save', function (next) {
	next()
})

module.exports = mongoose.model('vtmidtrans', UserSchema)
