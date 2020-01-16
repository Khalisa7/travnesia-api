var express = require('express')
var router = express.Router()
var travelPackage = require('../../../models/travel/travelModel')
var response = require('../../../common/response')

/**
 * Get Popular Travel Package List.
 * @method get
 * @param {object} req
 * @return json response
 * @public
 */
router.get('/product/travel/popular', function (req, res) {
  travelPackage.aggregate([
    {$match: {status : 1}},
    {
      $lookup:
      {
        from: 'packages',
        localField: 'destination_id',
        foreignField: 'destination',
        as: 'total_package'
      }
    }, {
      "$sort": { "hits": -1 }
    }, {
      $project: {
        _id: 0,
        name: '$name',
        slug: '$slug',
        image: '$image',
        price: '$base_price',
      }
    }]).exec(function (err, data) {
      response.success('Success to get popular package', res, data)
    })
})

module.exports = router
