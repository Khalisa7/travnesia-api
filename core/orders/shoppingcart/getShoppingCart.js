var express = require("express");
var router = express.Router();
var jwt = require("./../../../config/jwt_middleware/jwt");
var response = require("../../../common/response");
var shoppingCartModel = require("../../../models/orders/shoppingCartModel");
var packageModel = require("../../../models/travel/travelModel");
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

var generateToken = function () {
  var text = "";
  var length = 254;
  var possible = "ABCDESTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};

/**
 * Get Shopping Cart Data.
 * @method post
 * @param {object} req
 * @return json response
 * @public
 */
router.get("/shoppingcart/data", middleware, ACL.isUser, function (req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true });
  var userId = token.payload.u_id;
  if (token) {
    shoppingCartModel
      .aggregate([
        {
          $match: { u_id: userId, status: 0 }
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
            // u_id: '$u_id',
            product_id: "$product_id",
            subpackage_id: "$subpackage_id",
            product_details: {
              $cond: {
                if: "$subpackage_id",
                then: {
                  name: "$subpackage_details.name",
                  duration: "$subpackage_details.duration",
                  sku: "$subpackage_details.sku",
                  price: "$subpackage_details.base_price",
                  facility: "$subpackage_details.facility",
                  day_minimum_booking:
                    "$subpackage_details.day_minimum_booking",
                  qty_minimum_booking:
                    "$subpackage_details.qty_minimum_booking",
                  fixed_date: "$_details.fixed_date",
                  slug: "$subpackage_details.slug",
                  image: "$product_details.image",
                  status: "$subpackage_details.status"
                },
                else: {
                  name: "$product_details.name",
                  duration: "$product_details.duration",
                  sku: "$product_details.sku",
                  price: "$product_details.base_price",
                  facility: "$product_details.facility",
                  day_minimum_booking: "$product_details.day_minimum_booking",
                  qty_minimum_booking: "$product_details.qty_minimum_booking",
                  fixed_date: "$product_details.fixed_date",
                  slug: "$product_details.slug",
                  image: "$product_details.image",
                  status: "$product_details.status"
                }
              }
            },
            qty: "$qty",
            date_deparature: "$date_deparature",
            status: "$status",
            total_amount: {
              $cond: {
                if: "$subpackage_id",
                then: {
                  $sum: {
                    $multiply: ["$subpackage_details.base_price", "$qty"]
                  }
                },
                else: {
                  $sum: {
                    $multiply: ["$product_details.base_price", "$qty"]
                  }
                }
              }
            }
          }
        }
      ])
      .exec(function (err, data) {
        if (err) {
          return response.error("error", res, {});
        } else if (!data) {
          return response.forbidden("items not found in shopping cart", res, {
            msg: "empty_items"
          });
        }

        let total = 0;
        for (i = 0; i < data.length; i++) {
          total += data[i].total_amount;
        }
        response.success("Success to fetch shoppingcart data", res, {
          count_items: data.length,
          total: total,
          data: data
        });
      });
  } else {
    response.error("Unauthorized", res, {});
  }
});

/**
 * Add to cart API
 */
router.post("/shoppingcart/data", middleware, ACL.isUser,function (req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true });
  var userId = token.payload.u_id;
  var product_id = req.body.product_id;
  var subpackage_id = req.body.subpackage_id || null;
  var qty = req.body.qty || 1;
  var date = req.body.date;
  var generatedToken = generateToken();
  var validateDate = Date.parse(date)

  var dateFormat = new Date()
  var today = dateFormat.getDate()
  var month = dateFormat.getMonth()
  var year = dateFormat.getFullYear()
  var hours = dateFormat.getHours()
  var minutes = dateFormat.getMinutes()
  var dateToday = today + '-' + month + '-' + year + ' ' + hours + ':' + minutes

  if (token && validateDate) {
    if (product_id && qty && date) {
      if (product_id && !subpackage_id) {
        packageModel
          .aggregate([
            {
              $lookup: {
                from: "subpackage",
                localField: "product_id",
                foreignField: "parent_id",
                as: "subpackage"
              }
            },
            {
              $project: {
                _id: 0,
                product_id: "$product_id",
                base_price: "$base_price",
                stock: "$stock"
              }
            },
            {
              $match: { product_id: product_id }
            }
          ])
          .exec(function (err, data) {
            if (err) {
              return response.error("failed connect to service", res, {});
            } else if (!data) {
              return response.notFound("package not found", res, {});
            } else if (qty >= parseInt(data[0].stock)) {
              return response.error(
                "Package not available for " + qty + " people",
                res,
                {}
              );
            } else {
              price = qty * data[0].base_price;
              shoppingCartModel.countDocuments(
                { u_id: userId, status: 0 },
                function (err, c) {
                  if (err) {
                    return response.error("error", res, {});
                  } else {
                    shoppingCartModel.countDocuments(
                      {
                        u_id: userId,
                        product_id: product_id,
                        subpackage_id: null
                      },
                      function (error, count) {
                        if (error) {
                          return response.error("error", res, {});
                        } else {
                          shoppingCartModel.updateOne(
                            {
                              u_id: userId,
                              product_id: product_id,
                              subpackage_id: null,
                              token: generatedToken,
                              status: 0
                            },
                            {
                              u_id: userId,
                              product_id: data[0].product_id,
                              created_at: dateToday,
                              date_deparature: date,
                              ip: req.ip,
                              origin: req.headers.origin,
                              qty: qty,
                              status: 0
                            },
                            {
                              upsert: 1
                            },
                            function (err) {
                              if (err) {
                                return response.error("Invalid Data", res, {});
                              } else {
                                return response.success(
                                  "success add or update to cart",
                                  res,
                                  { token: generatedToken }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          });
      } else if (product_id && subpackage_id) {
        packageModel
          .aggregate([
            {
              $lookup: {
                from: "subpackages",
                localField: "product_id",
                foreignField: "parent_id",
                as: "subpackage"
              }
            },
            {
              $unwind: "$subpackage"
            },
            {
              $project: {
                _id: 0,
                product_id: "$product_id",
                subpackage_id: "$subpackage.product_id",
                base_price: "$subpackage.base_price",
                stock: "$subpackage.stock"
              }
            },
            {
              $match: { product_id: product_id, subpackage_id: subpackage_id }
            }
          ])
          .exec(function (err, data) {
            if (err) {
              return response.error("failed connect to service", res, {});
            } else if (data.length == 0) {
              return response.notFound("package not found", res, {});
            } else if (qty >= parseInt(data[0].stock)) {
              return response.error(
                "Package not available for " + qty + " people",
                res,
                {}
              );
            } else {
              price = qty * data[0].base_price;
              shoppingCartModel.countDocuments(
                { u_id: userId, status: 0 },
                function (err, c) {
                  if (err) {
                    return response.error("error", res, {});
                  } else {
                    shoppingCartModel.countDocuments(
                      {
                        u_id: userId,
                        product_id: product_id,
                        subpackage_id: subpackage_id
                      },
                      function (error, count) {
                        if (error) {
                          return response.error("error", res, {});
                        } else {
                          shoppingCartModel.updateOne(
                            {
                              u_id: userId,
                              product_id: data[0].product_id,
                              subpackage_id: data[0].subpackage_id
                            },
                            {
                              $set: {
                                u_id: userId,
                                product_id: data[0].product_id,
                                subpackage_id: data[0].subpackage_id,
                                created_at: dateToday,
                                date_deparature: date,
                                ip: req.ip,
                                origin: req.headers.origin,
                                qty: qty,
                                token: generatedToken,
                                status: 0
                                // total_amount: price
                              }
                            },
                            {
                              upsert: 1
                            },
                            function (err) {
                              if (err) {
                                return response.error("error", res, {});
                              } else {
                                return response.success(
                                  "success add to cart",
                                  res,
                                  { token: generatedToken }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          });
      }
    } else {
      response.error("Invalid Parameter", res, {});
    }
  } else {
    response.error("Unauthorized", res, {});
  }
});

// router.delete("/shoppingcart/data/:package", middleware, ACL.isUser,function (req, res) {
//   var token = jwt.decode(getToken(req.headers), { complete: true });
//   var userId = token.payload.u_id;
//   let package_id = req.params.package;
//   if (package_id) {
//     shoppingCartModel.deleteOne(
//       { u_id: userId, product_id: package_id, subpackage_id: null },
//       function (err, result) {
//         if (err) {
//           return response.error("failed to delete", res, {});
//         } else if (result.n < 1) {
//           return response.notFound("items not found at cart", res, {});
//         } else {
//           return response.success("success remove from cart", res, {});
//         }
//       }
//     );
//   } else {
//     response.error("invalid parameter", res, {});
//   }
// });



// router.delete("/shoppingcart/data/:package/:subpackage", middleware, function (
//   req,
//   res
// ) {
//   var token = jwt.decode(getToken(req.headers), { complete: true });
//   var userId = token.payload.u_id;
//   let package_id = req.params.package;
//   let subpackage_id = req.params.subpackage || null;
//   if (package_id) {
//     shoppingCartModel.deleteOne(
//       { u_id: userId, product_id: package_id, subpackage_id: subpackage_id },
//       function (err, result) {
//         if (err) {
//           return response.error("failed to delete", res, {});
//         } else if (result.n < 1) {
//           return response.notFound("items not found at cart", res, {});
//         } else {
//           return response.success("success remove from cart", res, {});
//         }
//       }
//     );
//   } else {
//     response.error("invalid parameter", res, {});
//   }
// });
module.exports = router;
