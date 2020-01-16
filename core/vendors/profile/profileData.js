var flag = require('../../../config/jwt_middleware/errorCode.json')
var response = require('../../../common/response')
var express = require('express')
var router = express.Router()
const s3 = require('../../../config/s3.config.js')
var jwt = require('./../../../config/jwt_middleware/jwt')
var modelPackages = require('../../../models/travel/travelModel')
var modelVendor = require('../../../models/vendors/vendorsModel')
var ModelSession = require('../../../models/sessions/insertSession')

//import module for check user type
const middleware = require('./../../../config/jwt_middleware/middleware')
const ACL = require('./../../../config/acl_middleware/acl_verify')
var getToken = function(headers){
	if(!headers){
		return false
	}else{
		if(headers && headers.authorization){
			var parted = headers.authorization.split(' ')
			if(parted.length === 2){
				return parted[1]
			}else{
				return null
			}
		}else{
			return null
		}
	}
}

router.get('/profile/data',function(req,res){
	var authed = jwt.decode(getToken(req.headers))
	var vendorId = authed.payload.u_id

	// console.log(vendorId)

	if(authed){
		modelVendor.findOne({vendor_id : vendorId}, function(err, data){
				if(err || data == ''){
					if(err) console.log(err)
						response.notFound('Data Not Found', res, err)
				}else{
					response.success('Uwu data listed!',res,data)
				}
			})
	} else {
		response.error('Unauthorized !',res , err)
	}
})

router.get('/profile/data/product', middleware, ACL.isVendor, function(req,res){
	var authed = jwt.decode(getToken(req.headers))
	var vendorId = authed.payload.u_id

	if(authed){
		modelPackages.find({vendor_id : vendorId},function(err,data){
			if(err || data ==''){
				if(err) console.log(err)
					response.notFound('Data not found', res ,err)
			}else{
				response.success('Data Listed', res, data)
			}
		})
	}else{
		response.error('Unauthorized !', res, err)
	}
})

router.put('/profile/update', middleware,ACL.isVendor, function(req, res){
	var authed = jwt.decode(getToken(req.headers), { complete : true })
	var vendorId = authed.payload.u_id
	let body = req.body
	console.log(req.body)
	if(authed){
		modelVendor.findOneAndUpdate(
		{vendor_id : vendorId},
		{
			$set: {
				first_name : body.first_name,
				last_name  : body.last_name,
				address : body.address,
				phone	: body.phone,
				email  	: body.email,
				company_name : body.company_name,
				city : body.city,
				country	: body.country,
				postal_code : body.postal_code
			}
		},{
			upsert :true
		}, (err) => {
			if (!err) {
				response.success('Succes to update', res, {})
			}else{
				response.error('Failed !!',res , err)
			}
		}).select(['-_id','-password','-_v'])
	} else {
		response.error('Unauthorized', res, { data })
	}
})

router.post('/profile/update/photo',middleware, ACL.isVendor, function(req, res){
	var authed = jwt.decode(getToken(req.headers), { complete : true })
	var vendorId = authed.payload.u_id

	if(authed){
		modelVendor.findOne({ vendor_id : vendorId },(err, data) => {
			let bucket_name = 'travnesia'
			s3.deleteFile('vendor/avatar/' + data.avatar, bucket_name)
		}).select(['avatar'])

		let singleUpload = upload.single('file')
		singleUpload(req,res, function(err, some){
			if(err){
				return responese.error('This filetype is not allowed', res ,{error : err})
			}

			modelVendor.updateOne(
				{ vendor_id : vendorId },
				{ $set :  {avatar : req.file.key }},
				{ upsert : true },
				(err, res) => {
					if(err){
						return response.error('Upload failed', res, {})
					}
				})
			response.success('Avatar has been changed' ,res , { keyname : req.file.location })
		})
	}else{
		response.error('Unauthorized',res ,{})
	}
})

module.exports = router

