var express = require('express')
var router = express.Router()
var jwt = require('../../../config/jwt_middleware/jwt')
var response = require('../../../common/response')
var orderModel = require('../../../models/orders/salesOrderModel')

//import module for check user type
const middleware = require('./../../../config/jwt_middleware/middleware')
const ACL = require('./../../../config/acl_middleware/acl_verify')


var getToken = function (headers) {
    if (!headers) {
        return false
    } else {
        if (headers && headers.authorization) {
            var parted = headers.authorization.split(' ')
            if (parted.length === 2) {
                return parted[1]
            } else {
                return null
            }
        } else {
            return null
        }
    }
}

router.put('/accept/order/:orderId', function (req, res) {
    var token = jwt.decode(getToken(req.headers))
    var userId = token.payload.u_id
    if (token) {
        let orderId = req.params.orderId

        orderModel.findOneAndUpdate({ order_number: orderId, vendor_id: userId }, { approvement: 1 }, (error, data) => {
            if (error) {
                response.error('failed to accept order', res, error)
            } else if (!data) {
                response.notFound('Order not found', res, {})
            } else {
                response.success('Order accepted', res, {})
            }
        })
    } else {
        response.error('Unauthorized', res, {})
    }
})

router.put('/reject/order/:orderId', function (req, res){
    var token = jwt.decode(getToken(req.headers))
    var userId = token.payload.u_id
    if (token){
        let orderId = req.params.orderId

        orderModel.findOneAndUpdate({vendor_id : userId, order_number: orderId}, { approvement: 2}, (error, data) => {
            if (error) {
                response.error('fail to accept order', res, error)
            } else if(!data) {
                response.notFound('Order not found', res, {})
            } else {
                response.success('Order Rejected', res, {})
            }
        })
    } else {
        response.error('Unathorized', res, {})
    }
})

module.exports = router