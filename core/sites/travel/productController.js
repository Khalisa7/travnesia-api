var express = require('express')
var router = express.Router()
var modelPackage = require('../../../models/travel/travelModel')
var modelDestination = require('../../../models/destination/destinationModel')
var response = require('../../../common/response')

// Router for query search destination.
router.post('/product/travel/search', function (req, res) {
	var param = req.body
	var query = param.name
	if (query === ' ') {
		response.notFound('Failed to get Destination List', res, {})
	} else {
		modelDestination.find({ name: { '$regex': query, '$options': 'i' } }, function (err, data) {
			if (data === '' || err) return response.notFound('Failed to get Destination List', res, {})
			response.success('Success to get data', res, data)
		}).select(['name', '-_id'])
	}
  })
  
	router.get('/product/travel/detail/:slug',function(req,res){
		let data = req.params.slug;

		  if(data == null){
			  response.notFound('Package not Found',res,{});
		  }else{
			modelPackage.aggregate([
				{ $lookup:
						{
						from: 'vendors',
						localField: 'vendor_id',
						foreignField: 'vendor_id',
						as: 'detail_vendor'
						}
					},{
						$lookup : 
						{
							from : 'subpackages',
							localField : 'product_id',
							foreignField : 'parent_id',
							as : 'subpackageslist'
						}
					},{
						$lookup : 
						{
							from : 'itinerary',
							localField : 'product_id',
							foreignField : 'parent_id',
							as : 'itinerarylist'
						}
					},{
						$unwind : "$detail_vendor"
					},{
						$project:{
							_id:0,	
							name:"$name",
							id_desc:"$id_desc",
							package_id : "$product_id",
							slug:"$slug",
							image:"$image",
							type:"$featured",
							facility : "$facility",
							guarantee :"$guarantee",
							vendor_id:"$vendor_id",	
							base_price:"$base_price",
							day_minimum_booking:"$day_minimum_booking",
							vendor: {
									company_name  : "$detail_vendor.company_name",
									avatar 		: "$detail_vendor.avatar",
							},
							subpackages : "$subpackageslist",
							itinerary : "$itinerarylist",
					}
			},{$match: {slug: data}}
				]).exec(function(err,data){
					if(err || data == ''){
						if (err) console.log(err)
						response.notFound('Package not Found',res,{});
					}else{
						response.success("Hurray data listed !!",res ,data)
					}
				});
		  }
  });

module.exports = router