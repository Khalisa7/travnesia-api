var express = require("express");
var router = express.Router();
var jwt = require("./../../../config/jwt_middleware/jwt");
var response = require("../../../common/response");
var shoppingCartModel = require("../../../models/orders/shoppingCartModel");
var modelUser = require("../../../models/customers/customerModel");
var code = require("./../../../config/jwt_middleware/errorCode.json");
var middleware = require("./../../../config/jwt_middleware/middleware");

//import module for check user type
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

//Sum Order Price
function sumValue(total, num) {
  return total + num;
}

/**
 * Get Checkout Data
 * @method post
 * @param {object} req
 * @return json response
 * @module midtrans
 * @public
 */
router.get("/checkout/data", middleware, ACL.isUser, function (req, res) {
  var token = jwt.decode(getToken(req.headers));
  var userId = token.payload.u_id;
  var tokenCart = req.query.token;
  if (token) {
    modelUser
      .findOne({ u_id: userId }, function (err, data) {
        if (err || data == null) {
          response.error("Bad request", res, code.unsupported_auth_token);
        } else {
          var customer = data
          console.log(data.country)
          shoppingCartModel
            .aggregate([
              {
                $match: {
                  u_id: { $eq: userId },
                  status: { $eq: 0 },
                  token: { $eq: tokenCart }
                }
              },
              {
                $lookup: {
                  from: "packages",
                  localField: "product_id",
                  foreignField: "product_id",
                  as: "product_details"
                }
              },
              {
                $lookup: {
                  from: "subpackages",
                  localField: "subpackage_id",
                  foreignField: "product_id",
                  as: "subpackage_details"
                }
              },
              {
                $unwind: "$product_details"
              },
              {
                $unwind: {
                  path: "$subpackage_details",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $project: {
                  _id: 0,
                  qty: "$qty",
                  date_deparature: "$date_deparature",
                  status: "$status",
                  total_amount: "$total_amount",
                  product_details: {
                    name: "$product_details.name",
                    sku: "$product_details.sku",
                    price: "$product_details.base_price",
                    facility: "$product_details.facility",
                    day_minimum_booking: "$product_details.day_minimum_booking",
                    qty_minimum_booking: "$product_details.qty_minimum_booking",
                    fixed_date: "$product_details.fixed_date",
                    slug: "$product_details.slug",
                    image: "$product_details.image",
                    status: "$product_details.status"
                  },
                  subpackage: "$subpackage_details"
                }
              }
            ])
            .exec(function (err, cart) {
              if (cart != "") {
                response.success("Success to fetch shoppingcart data", res, {
                  customer,
                  cart
                });
              } else {
                response.notFound("No data in cart", res, {});
              }
            });
        }
      })
      .select(["-_id", "-password", "-hash"]);
  } else {
    response.error("Unauthorized request", res, {});
  }
});

module.exports = router;
