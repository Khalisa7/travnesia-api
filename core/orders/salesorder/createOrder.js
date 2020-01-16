var express = require("express");
var router = express.Router();
var jwt = require("./../../../config/jwt_middleware/jwt");
var response = require("../../../common/response");
var cartModel = require("../../../models/orders/shoppingCartModel");
var SalesOrderModel = require("../../../models/orders/salesOrderModel");
var packageModel = require("../../../models/travel/travelModel");
var number = require("random-number");
var middleware = require("./../../../config/jwt_middleware/middleware");
var code = require("./../../../config/jwt_middleware/errorCode.json");
var mailOrderCustomer = require("./../../../common/emails/controller/customer/mailOrder");
var mailOrderVendor = require("./../../../common/emails/controller/vendor/mailOrder");

//import module check user type
const ACL = require('./../../../config/acl_middleware/acl_verify')

/**
 * Get Token Header
 * @method get
 * @param {object} headers
 * @return data
 * @public
 */
var getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(" ");
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

//Generate Invoice Number
var invoiceNumber = number.generator({
  min: 100,
  max: 100000000,
  integer: true
});

//Sum Order Price
function sumValue(total, num) {
  return total + num;
}

/**
 * Create Sales Order.
 * @method post
 * @param {object} req
 * @return json response
 * @module midtrans
 * @public
 */
router.post("/order/create", middleware, ACL.isUser, function (req, res) {

  //Define and Get Payload
  var token = jwt.decode(getToken(req.headers));
  var userId = token.payload.u_id;
  var orderToken = req.body.token;

  if (token) {  //Check if token exist

    //Shopping Cart Model with Aggregate to package and subpackage collection
    cartModel
      .aggregate([
        {
          //Joining shoppingcart to package by refering product_id
          $lookup: {
            from: "packages",
            localField: "product_id",
            foreignField: "product_id",
            as: "product_order"
          }
        },
        {
          //Joining shoppingcart to subpackage by refering subpackage_id
          $lookup: {
            from: "subpackages",
            localField: "subpackage_id",
            foreignField: "product_id",
            as: "subpackage"
          }
        },
        {
          //Get data and matching it with u_id, status 0 and token from orderToken Payload above
          $match: { u_id: userId, status: 0, token: orderToken }
        },
        {
          //Unwind product_order to prevent object
          $unwind: "$product_order"
        },
        {
          //Unwind subpackage to prevent object
          $unwind: {
            path: "$subpackage",
            preserveNullAndEmptyArrays: true //Allow empty
          }
        },
        {
          //Projection data results
          $project: {
            _id: 0,
            u_id: "$u_id",
            data: "$product_order",
            subpackage: "$subpackage",
            qty: "$qty",
            date_deparature: "$date_deparature",
            status: "$status"
          }
        }
      ])
      .exec(function (err, data) {

        //Check if Data not null and data exist
        if (data[0] != null || data != "") {
          const date = new Date(); // define date
          let genOrderNumber = Date.parse(date) + invoiceNumber(); //Generate invoice number
          let index = 0 //define index as 0

          //Check how many data in result
          for (index; index < data.length; index++) {

            //Define variable and object
            let product = []; // product object
            let basePrice = []; // pricing object
            let productId = []; // product ID object
            let totalAmount; // define total amount
            let i;
            let countTotal;

            //Check how many data in shopping cart
            for (i = 0; i < data.length; i++) {
              //Check if subpackage exist
              if (data[i].subpackage) {
                //if exist set and count total amount base on subpackage price
                countTotal = data[i].subpackage.base_price * data[i].qty
              } else {
                //if doesn't exist set and count total amount base on parent package price
                countTotal = data[i].data.base_price * data[i].qty
              }

              product.push(data[i]); // push product data to product variable
              basePrice.push(countTotal); // push pricing data to basePrice variable
              productId.push(data[i].data.product_id); // push product ID data to productId variable
            }

            //set time limit of payment, the reference is LIMIT_PAYMENT = 10 Hours
            var limit_time 
            limit_time = new Date()
            limit_time.setTime(limit_time.getTime() + parseInt(process.env.LIMIT_PAYMENT))

            //Define total amount and reduce it
            totalAmount = basePrice.reduce(sumValue);

            // Save Product Order Data into variable orderData
            let orderData = new SalesOrderModel({
              u_id: userId,
              product_order: { product },
              vendor_id: product[0].data.vendor_id,
              product_offers: req.body.coupon,
              order_number: genOrderNumber.toString(),
              snap_token: req.body.snap_token,
              payment_number: "INV-" + genOrderNumber,
              customer_firstname: req.body.customer_firstname,
              customer_lastname: req.body.customer_lastname,
              customer_address: req.body.customer_address,
              customer_city: req.body.customer_city,
              customer_province: req.body.customer_province,
              customer_country: req.body.customer_country,
              customer_phone: parseInt(req.body.customer_phone),
              customer_email: req.body.customer_email,
              base_subtotal: totalAmount,
              base_discount: 0,
              base_tax: 0,
              base_grandtotal: totalAmount,
              global_rate: 14500,
              total_due: totalAmount,
              limit_payment: limit_time,
              payment_method: 'channel',
              order_status: 0,
              refunded: 0,
              total_refunded: 0,
              status: 1,
              created_at: new Date(),
              update_at: new Date(),
              approvement: 0,
            });

            //Save orderData to collection in database
            orderData.save(function (err) {
              if (err) { //check if error
                response.error("Failed to create order", res, err); //return error
              } else {
                //if success, Update status cart data to 1
                cartModel.updateOne(
                  { product_id: { $in: productId }, token: { $in: orderToken } },
                  { $set: { status: 0 } },
                  { upsert: true },
                  err => {
                    if (err) { // Check if update error
                      response.error("Failed to create order", res, code.update_cart_failed); //Return error
                    } else {

                      //Get Customer Data information
                      let customerName =
                        orderData.customer_firstname +
                        " " +
                        orderData.customer_lastname;

                      let paramsEmailCustomer = {
                        transaction_id: orderData.order_number,
                        package_name: orderData.product_order.product[0].data.name,
                        slug: orderData.product_order.product[0].data.slug,
                        total_pax: orderData.product_order.product.qty + " Pax",
                        total_amount: "Rp. " + orderData.base_grandtotal
                      };

                      //Send mail notification to customer
                      mailOrderCustomer.mailOrder(
                        orderData.customer_email,
                        customerName,
                        paramsEmailCustomer
                      );

                      //Get Vendor data information
                      packageModel
                        .aggregate([
                          {
                            $match: {
                              product_id:
                                orderData.product_order.product[0].data.product_id
                            }
                          },

                          {
                            $lookup: {
                              from: "vendors",
                              localField: "vendor_id",
                              foreignField: "vendor_id",
                              as: "vendor"
                            }
                          },

                          { $unwind: "$vendor" },

                          {
                            $project: {
                              _id: 0,
                              email: "$vendor.email",
                              first_name: "$vendor.first_name",
                              last_name: "$vendor.last_name"
                            }
                          }
                        ])
                        .exec((err, data) => {
                          if (err) { //check if no data
                            response.error("Failed to create order", res, code.update_cart_failed); //Return error
                          } else {

                            //Define vendor data information
                            let vendor_email = data[0].email || "";
                            let vendor_name =
                              data[0].first_name + " " + data[0].last_name;

                            //Send mail notification to vendor
                            mailOrderVendor.mailOrder(
                              vendor_email,
                              vendor_name,
                              paramsEmailCustomer
                            );
                          }
                        });
                      response.success("Success to create order", res, {
                        code: orderData.order_number
                      });
                    }
                  }
                );
              }
            });
            break;
          }
        } else {
          response.error("Failed to create order", res, code.no_cart_available);
        }
      });
  } else {
    response.error("Unauthorized request", res, {});
  }
});

module.exports = router;
