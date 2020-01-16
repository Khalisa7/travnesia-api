var express = require('express')
var router = express.Router()
var response = require('../../../common/response')
// var Transaction = require('../../../models/vendors/tracsactionModel')
var jwt = require('../../../config/jwt_middleware/jwt')
var orderModel = require('../../../models/orders/salesOrderModel')


var getToken = function(headers) {
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

//get transaction history vendor
router.get('/transaction', function(req, res){
    var token = jwt.decode(getToken(req.headers), {complete: true});
    var u_id = token.payload.u_id;
    var perpage = 10
    var page = req.params.page || 1
    
    if(token) {
        orderModel
        .aggregate([
            {
                $match: {vendor_id: u_id }
              },
              {
                $sort: { created_at: -1 }
              },
              {
                $skip: ((perpage * page)-perpage)
              },
              {
                $limit: perpage
              },
              {
                  $unwind : '$product_order'
              },{
                  $unwind : '$product_order.product'
              },{
                  $unwind: '$product_order.product.data'
              },
              {
                $project: {
                  order_id : '$order_number',
                  total: '$total_due',
                  status: '$order_status',
                  date: '$created_at',
                  product : '$product_order.product.data.name',
                  approvement : '$approvement',
                  slug : "$product_order.product.data.slug"
              }
            }
            
        ])
        .exec(function(err, data){
            if (err) {
                response.notFound('Data Not Found', res, err);
            } else {
                response.success('Data Stored', res, data)
            }
        })
    } else {
        response.error('Unauthorized', res, {})
    }
})




module.exports = router