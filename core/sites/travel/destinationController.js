var express = require('express')
var router = express.Router()
var modelPackage = require('../../../models/travel/travelModel')
var modelDestination = require('../../../models/destination/destinationModel')
var modelSubPack = require('../../../models/travel/subPackagesModel')
var response = require('../../../common/response')
var code = require('./../../../config/jwt_middleware/errorCode.json')


// Router for getting list of package for end user.
//add slug
router.get('/product/travel', function ( req, res ) {
  modelPackage.find({$or:[{'status':1},{'status': 2}]},function (err, data) {
    try {
      response.success('Success get package list', res, data)
    } catch (err) {
      response.error('Bad Request', res, {})
    }
  }).select(['destination', 'duration', 'slug' ,'name', 'facility', 'image', 'created_at', 'base_price'])
})

// Router for getting list of popular destination city for end user.
router.get('/product/travel/destination/popular', function (req, res) {
  modelDestination.aggregate([{
    $lookup:
    {
      from: 'packages',
      localField: 'destination_id',
      foreignField: 'destination',
      as: 'total_package'
    }
  }, {
      $project: {
        _id: 0,
        name: '$name',
        short_desc: {
          id: "$id_shortdesc",
          en: "$en_shortdesc",
          an: "$an_shortdesc",
          zh: "$zh_shortdesc"
        },
        description: {
          id: "$id_desc",
          en: "$en_desc",
          an: "$an_desc",
          zh: "$zh_desc"
        },
        slug: '$slug',
        image: '$image',
        type: '$featured',
        availablePackage: {
          $size: {
            $filter: {
              input: '$total_package',
              as: 'package',
              cond: { $eq: ['$$package.status', 1] }
            }
          }
        },
      }
  }]).exec(function (err, data) {
    response.success('Success to get destinations', res, data)
  })
})


// router.get('/destination/popular',function (req,res){
//   modelDestination.find({}, function(err, data){
//     try{
//       response.success("Yeay Data Stored", res, data)
//     } catch (err){
//       response.error("Data fail to stored", res, err)
//     }
//   }).select(['name','image'])
// })

router.get('/destination/popular', function(req,res){
  modelDestination.aggregate([
  {
    $sort : { hits: -1}
  },{
    $limit : 4
  },{
    $project: {
      name  : '$name',
      image : '$image'
    }
  }
  ])
  .exec(function(err,data){
    if(err){
      response.error("Ups data fail to store :(", res, err)
    } else {
      response.success('Yihii! Data stored', res, data)
    }
  })
})

module.exports = router
