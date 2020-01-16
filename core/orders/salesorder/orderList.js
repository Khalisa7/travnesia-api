var express = require("express");
var router = express.Router();
var jwt = require("../../../config/jwt_middleware/jwt");
var response = require("../../../common/response");
var orderListModel = require("../../../models/orders/salesOrderModel");

//import module for check user type
const middleware = require('./../../../config/jwt_middleware/middleware')
const ACL = require('./../../../config/acl_middleware/acl_verify')

var getToken = function(headers) {
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

//route for get history booking package
router.get("/history",middleware, ACL.isUser, function(req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true });
  var u_id = token.payload.u_id;
  if (token) {
    orderListModel
      .aggregate([
        {
          $match: { u_id: { $eq: u_id } }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $lookup: {
            from: "vendors",
            localField: "vendor_id",
            foreignField: "product_order.product.data.vendor_id",
            as: "data_vendor"
          }
        },
        {
          $unwind: "$data_vendor"
        },
        {
          $unwind: "$product_order.product"
        },
        {
          $unwind: "$product_order.product.data"
        },
        {
          $project: {
            orderId: "$order_number",
            qty: "$product_order.product.qty",
            total: "$total_due",
            package_name: "$product_order.product.data.name",
            facilities: "$product_order.product.data.facility",
            date: "$product_order.product.date_deparature",
            duration: "$product_order.product.data.duration",
            vendor: {
              companyname: "$data_vendor.company_name"
            }
          }
        }
      ])
      .exec(function(err, data) {
        if (err) {
          response.notFound("Not Found", res, err);
        } else {
          response.success("Data Stored", res, data);
        }
      });
  } else {
    response.error("Unauthorized", res, {});
  }
});


router.get("/mybooking",middleware, ACL.isUser, function(req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true });
  var id = token.payload.u_id;

  if (token) {
    orderListModel
      .aggregate([
        { $match:  {u_id: id ,  order_status: "0", order_status: 'pending'} },
        {
          $sort: { created_at: -1 }
        },
        {
          $unwind: "$product_order"
        },
        {
          $unwind: "$product_order.product"
        },
        {
          $unwind: "$product_order.product.data"
        },
        {
          $project: {
            order_number: "$order_number",
            date_booking: "$created_at",
            total: "$total_due",
            destination: "$product_order.product.data.name"
          }
        }
      ])
      .exec(function(err, data) {
        if (err) {
          response.error("Oops, data fail to fetch", res, err);
        } else {
          response.success("Data listed", res, data);
        }
      });
  } else {
    response.error("Unauthorized", res, {});
  }
});

router.get("/mybooking/last",middleware, ACL.isUser, function(req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true });
  var id = token.payload.u_id;

  if (token) {
    orderListModel
      .aggregate([
        { $match:  {u_id: id ,  order_status: "0", order_status: 'pending'} },
        {
          $sort: { created_at: -1 }
        },
        {
          $unwind: "$product_order"
        },
        {
          $unwind: "$product_order.product"
        },
        {
          $unwind: "$product_order.product.data"
        },
        {
          $limit: 1
        },
        {
          $project: {
            order_number: "$order_number",
            date_booking: "$created_at",
            total: "$total_due",
            destination: "$product_order.product.data.name"
          }
        }
      ])
      .exec(function(err, data) {
        if (err) {
          response.error("Oops, data fail to fetch", res, err);
        } else {
          response.success("Data listed", res, data);
        }
      });
  } else {
    response.error("Unauthorized", res, {});
  }
});

module.exports = router;
