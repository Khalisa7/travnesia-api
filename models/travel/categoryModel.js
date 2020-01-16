const mongoose = require('mongoose')
const Schema = mongoose.Schema

var CategorySchema = new Schema({
    category_id: {type: String, required: true},
    name: {type: String, required: true},
    description: String,
    image: String,
    status: {type: Number, required: true}
})

module.exports = mongoose.model('productcategory', CategorySchema, 'productcategory')