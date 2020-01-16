var express = require('express')
var router = express.Router()
var response = require('../../../../common/response')
var jwt = require('./../../../../config/jwt_middleware/jwt')
var salesOrderModel = require('../../../../models/orders/salesOrderModel')
var Midtrans = require('./config')
var code = require('./../../../../config/jwt_middleware/errorCode.json')
var middleware = require('./../../../../config/jwt_middleware/middleware')
var Midtrans = require('./../../../../services/payment/midtrans/code/config')

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

// /**
//  * Get Transaction Details
//  * @method get
//  * @param data
//  * @return data
//  * @public
//  */
// var getPaymentInformation = function(orderId) {
//   try{  
//       Midtrans.status(orderId)
//       .then( function(snap) {
//         r
//       })
//   }catch(err) {
//     return false
//   }
// }

/**
 * Get Midtrans SNAP Token.
 * @method post
 * @param {object} req
 * @return json response
 * @module midtrans
 * @public
 */
router.post('/transaction/process', middleware, function (req, res) {

  //Get JWT Payload and Decode
  var token = jwt.decode(getToken(req.headers))
  var userId = token.payload.u_id
  var param = req.body
  var orderId = parseInt(param.order_id)

  if (orderId) {
    //Find Sales Order base on Order ID and JWT User ID Payload
    salesOrderModel.find({ u_id: userId, order_number: orderId, order_status: 0 }, function (err, order) {
      try {

        //Parse the result
        const data = JSON.parse(JSON.stringify(order[0]))
        const status = order[0].order_status //Get Order Status

        if (status === "0") {
          //Get Midtrans Transaction Token and return Transaction Details if Order Status Not proccessed = 0
          Midtrans.transaction(data)
            .then((snap) => {
              var token = snap.data.token
              //Save Midtrans Token to Sales Order Collection
              salesOrderModel.updateOne({ u_id: userId, order_number: orderId }, { $set: { snap_token: token } }, { upsert: true }, function (err, success) {
                if (err) {
                  response.error('Something wrong, try again', res, code.failed_update_snaptoken)
                } else {
                  response.success(true, res, { status: status, order_number: order[0].order_number, token })
                }
              })
            })
            .catch((err) => {
              //Return transaction Details if Midtrans token is false or Order has already transaction token
              response.success(true, res, { customer: order, item })
            })

        } else {
          //return Transaction Details if Order Status is Processed = pending
          response.success(true, res, { customer: order, item })
        }
      } catch (err) {
        //Return error if Order ID found in database
        response.error('Order number not found', res, code.order_not_found)
      }


    }).select('-_id')
  } else {
    //Return error if Order ID empty
    response.error('No Order ID', res, {})
  }
})

/**
 * Get Payment Detail.
 * @method post
 * @param {object} req
 * @return json response
 * @module midtrans
 * @public
 */
router.post('/transaction/status', middleware, function (req, res) {

  //Get JWT Payload and Decode
  var token = jwt.decode(getToken(req.headers))
  var userId = token.payload.u_id
  var param = req.body
  var orderId = parseInt(param.order_id)

  if (orderId) {
    //Get Sales Order base on User ID and Order ID
    salesOrderModel.find({ u_id: userId, order_number: orderId }, function (err, order) {
      try {

        //Get Product Info
        var product = order[0].product_order.product
        var item = [] //Define items as array variable
        //Count product total or length
        for (i = 0; i < product.length; i++) {

          //Save the result to an array variable @productData
          var productData = {
            u_id: product[i].u_id,
            date_deparature: product[i].date_deparature,
            qty: product[i].qty,
            data: {
              name: product[i].data.name,
              slug: product[i].data.slug,
              image: product[i].data.image,
              base_price: product[i].data.base_price,
              subpackage: order[0].product_order.product[0].subpackage
            }

          }

          //Push @productData to item variable and set it to array
          item.push(productData)
        }

        //Get Sales Order Data Information and save it to @orderData
        var orderData = {
          order_number: order[0].order_number,
          payment_number: order[0].payment_number,
          order_status: order[0].order_status,
          refunded: order[0].refunded,
          total_refunded: order[0].total_refunded,
          payment_method: order[0].payment_method,
          discount: order[0].base_discount,
          total_due: order[0].total_due,
          date_order: order[0].created_at,
          pay_limit_time: order[0].limit_payment
        }

        //Parse order data result
        const data = JSON.parse(JSON.stringify(order[0]))

        //Make Condition to check order status
        if (order[0].order_status === "0") {

          // If true / Order Status is not processed, process Midtrans Transaction Token
          Midtrans.transaction(data)
            .then((snap) => {
              var token = snap.data.token //Get Token result

              //Find Sales Order Data in database base on User ID and Order ID and update the snap_token field.
              salesOrderModel.updateOne({ u_id: userId, order_number: orderId }, { $set: { snap_token: token } }, { upsert: true }, function () {
                response.success(true, res, { token, detail: orderData, item })
              })

            })
            .catch((err) => {
              //Return false if cannot get Midtrans transaction token
              response.error(false, res, { err })
            })
        } else {
          //If false, or order status already processed, just return the order details.
          Midtrans.status(orderId)
            .then(function (snap) {
              var result = snap.data

              //Save Payment Details from Midtrans to an array @paymentDetail
              var paymentDetail = {
                payment_status: result.transaction_status,
                payment_type: result.payment_type,
                gross_amount: result.gross_amount,
                va_numbers: result.va_numbers
              }
              response.success(true, res, { token: order[0].snap_token, detail: orderData, payment: paymentDetail, item })
            })

        }
      } catch (err) {
        response.error('Order number not found', res, code.order_not_found)
      }

    }).select('-_id')
  } else {
    //return error if Order ID is Null
    response.error('No Order ID', res, {})
  }
})

module.exports = router
