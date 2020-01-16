var express = require('express')
var router = express.Router()
var response = require('../../../../common/response')
var salesOrderModel = require('../../../../models/orders/salesOrderModel')
var code = require('./../../../../config/jwt_middleware/errorCode.json')
var VtCallback = require('./../../../../models/vtmidtrans/vtCallbackModels')
var crypto = require('crypto')

//send mail nofification
var mailConfirmCustomer = require('./../../../../common/emails/controller/customer/mailOrder')
var mailConfirmVendor = require('./../../../../common/emails/controller/vendor/mailOrder')

/**
 * Get Midtrans SNAP Token.
 * @method post
 * @param {object} req
 * @return json response
 * @module midtrans
 * @public
 */
router.post('/transaction/vtmdtrans/status', function (req, res) {
  var hash = crypto.createHash('sha512')
  const hashSignature = hash.update(req.body.order_id + req.body.status_code + req.body.gross_amount + process.env.SERVER_KEY)
  const signatureKey = hashSignature.digest('hex')

  var va_number = req.body.va_numbers
  if (va_number) {
    va_number = req.body.va_numbers[0]['va_number']
    var bank = req.body.va_numbers[0]['bank']
  } else {
    va_number = 0
  }

  var payload = {
    transaction_time: req.body.transaction_time,
    transaction_status: req.body.transaction_status,
    transaction_id: req.body.transaction_id,
    transaction_message: req.body.transaction_message,
    status_code: req.body.status_code,
    signature_key: signatureKey,
    payment_type: req.body.payment_type,
    order_id: req.body.order_id,
    channel_response_message: req.body.channel_response_message,
    channel_response_code: req.body.channel_response_code,
    card_type: req.body.card_type,
    va_numbers: { va_number: va_number, bank: bank },
    bank: req.body.bank,
    approval_code: req.body.approval_code,
    masked_card: req.body.masked_card,
    gross_amount: req.body.gross_amount,
    payment_amounts: req.body.payment_amounts,
    fraud_status: req.body.fraud_status,
    biller_code: req.body.biller_code,
    biller_key: req.body.biller_key
  }

  var vtData = new VtCallback(payload)

  try {
    vtData.save(function (err) {
      if (err) {
        response.error('Something wrong', res, err)
      } else {
        salesOrderModel.findOneAndUpdate({ order_number: req.body.order_id }, { $set: { order_status: req.body.transaction_status, payment_method: req.body.payment_type } }, { new: true, useFindAndModify: false }, function (err, success) {
          let orderId = req.body.order_id
          let transaction_status = payload.transaction_status
          let payment_type = payload.payment_type
          let bank_name = ""
          if (payload.va_numbers.bank == "bni") {
            bank_name = "Bank BNI"
          } else if (payload.va_numbers.bank == "permata") {
            bank_name = "Bank Permata"
          } else if (payload.va_numbers.bank == "bca") {
            bank_name = "Bank BCA"
          }

          let bank_data = {
            bank_number: payload.va_numbers.va_number,
            bank_name: bank_name
          }
          salesOrderModel.aggregate([{
            $match: {
              order_number: orderId
            },
          }, {
            $unwind: '$product_order.product'
          }, {
            $unwind: '$product_order.product.data'
          },
          {
            $lookup: {
              from: 'vendors',
              localField: 'product_order.product.data.vendor_id',
              foreignField: 'vendor_id',
              as: 'vendor'
            }
          },
          { $unwind: '$vendor' },
          {
            $project: {
              _id: 0,
              vendor: {
                email: '$vendor.email',
                first_name: '$vendor.first_name',
                last_name: '$vendor.last_name'
              },
              user: {
                email: '$customer_email',
                first_name: '$customer_firstname',
                last_name: '$customer_lastname'
              },
              order_number: '$order_number',
              slug: '$product_order.product.data.slug',
              package_name: '$product_order.product.data.name',
              total_pax: '$product_order.product.qty',
              total_amount: '$base_grandtotal'
            }
          }], (err, data) => {
            console.log("proses ya...")
            if (err) {
              console.log(err)
            } else if(!data){
              console.log("Order Data Not Found")
            } else {
              // console.log(data)
              let paramsEmail = {
                transaction_id: data[0].order_number,
                package_name: data[0].package_name,
                slug: data[0].slug,
                total_pax: data[0].total_pax + ' Pax',
                total_amount: 'Rp. ' + data[0].total_amount
              }

              //send mail notification to customer
              let email_user = data[0].user.email
              let fullname_user = data[0].user.first_name + ' ' + data[0].user.last_name

              //para notification to vendor
              let email_vendor = data[0].vendor.email
              let fullname_vendor = data[0].vendor.first_name + ' ' + data[0].vendor.last_name

              if (transaction_status == "success") {
                mailConfirmCustomer.confirmPayment(email_user, fullname_user, paramsEmail)
                mailConfirmVendor.confirmPayment(email_vendor, fullname_vendor, paramsEmail)
              } else if (transaction_status == "pending") {
                if (payment_type == "bank_transfer" && va_number != 0) {
                  mailConfirmCustomer.pendingPayment(email_user, fullname_user, paramsEmail, bank_data)
                }
              } else if (transaction_status == "expire") {
                mailConfirmCustomer.expirePayment(email_user, fullname_user, paramsEmail)
              }


            }
          })
          response.success('recorded', res, {})
        })
      }
    })
  } catch (err) {
    response.error('Something wrong', res, code.order_not_found)
  }
})

module.exports = router
