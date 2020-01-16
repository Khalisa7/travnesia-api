var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var cartSchema = new Schema({
  u_id: { type: String, required: true },
  product_id: { type: String, required: true },
  subpackage_id: { type: String, default: null },
  qty: { type: Number, required: true },
  date_deparature: { type: String, required: true },
  ip: { type: String, required: true },
  origin: { type: String },
  created_at: { type: String },
  token: { type: String, required: true, unique: true },
  status: Number
});

cartSchema.pre("save", function (next) {
  return next();
});

module.exports = mongoose.model("Shoppingcart", cartSchema);
