var express = require('express')
var router = express.Router()
var modelPayment = require ('../../../models/orders/salesOrderModel')
var response = require('../../../common/response')
var jwt = require('./../../../config/jwt_middleware/jwt')

//import module for check user type
const middleware = require('../../../config/jwt_middleware/middleware')
const ACL = require('../../../config/acl_middleware/acl_verify')


var getToken = function(headers){
    if(headers && headers.authorization){
        var parted = headers.authorization.split(' ')
        if (parted.length === 2){
            return parted[1]
        } else {
            return null
        }
    } else {
        return null
    }
}

//route for get detail order status
router.get('/payment/orderstatus',middleware, ACL.isUser, function(req, res){
    var token = jwt.decode(getToken(req.headers),{ complete: true})
    var u_id = token.payload.u_id
    
    if(token) {
        modelPayment.findOne({u_id: u_id}, function (err, data){
            try{
                response.success('Succes fecth data', res, data)
            } catch (err) {
                response.error('Failed to fetch data', res, {})
            }
        }).select(['order_number', 'base_subtotal', 'created_at', 'total_due', 'product_order.product.u_id', 'product_order.product.qty', 'product_order.product.date_deparature','product_order.product.total_amount', 'product_order.product.data.name', 'product_order.product.data.image'])
    } else {
        response.error('Unauthorized', res, {})
    }
})

module.exports = router