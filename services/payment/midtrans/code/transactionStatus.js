var express = require('express')
var router = express.Router()
var response = require('../../../../common/response')
var jwt = require('./../../../../config/jwt_middleware/jwt')
var salesOrderModel = require('../../../../models/orders/salesOrderModel')
var Midtrans = require('./config')
var code = require('./../../../../config/jwt_middleware/errorCode.json')
var middleware = require('./../../../../config/jwt_middleware/middleware')

/**
 * Get Token Header
 * @method get
 * @param {object} headers
 * @return data
 * @public
 */
var getToken = function (headers) {
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
/**
 * Get Payment Detail.
 * @method post
 * @param {object} req
 * @return json response
 * @module midtrans
 * @public
 */
router.post('/transaction/status', middleware, function (req, res) {
  var token = jwt.decode(getToken(req.headers))
  var userId = token.payload.u_id
  var param = req.body
  var orderId = parseInt(param.order_id)

  if (orderId) {
    salesOrderModel.find({ u_id: userId, order_number: orderId }, function (err, order) {

      try {
          Midtrans.status(data)
            .then((snap) => {
              console.log(snap)
            })
            .catch((err) => {
              response.error(false, res, { err })
			})
			
      } catch (err) {
        response.error('Order ID Not found', res, code.order_not_found)
	  }
	  
    }).select('-_id')
  } else {
    response.error('Order ID Not Found', res, code.order_not_found)
  }
})

module.exports = router
