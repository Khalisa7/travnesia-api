var express = require('express')
var router = express.Router()
var modelPackage = require('../../../models/travel/travelModel')
var modelDestination = require('../../../models/destination/destinationModel')
var modelSubPack = require('../../../models/travel/subPackagesModel')
var response = require('../../../common/response')
var code = require('./../../../config/jwt_middleware/errorCode.json')

router.get('/city/:slug', (req, res) => {
    try {
        modelDestination.aggregate([{
            $lookup:
            {
                from: 'packages',
                localField: 'destination_id',
                foreignField: 'destination',
                as: 'package'
            }
        },{
            $match: {
                slug: req.params.slug
            }
        }, {
            $unwind: '$package'
        },{
            $group: {
                _id: 0,
                name: '$name',
                image: '$image',
                desc: {
                    id_desc: '$id_desc'
                },
                packages: {
                    $push: {
                        name: '$package.name'
                    }
                }
    
            }
        }]).exec(function (err, data) {
            if(err){
                console.log(err)
                return response.error("Error", res)
            }else if(!data){
                return response.notFound("Data not found", res, {})
           }else{
            console.log("Akses ke Controller Kota")
            return response.success('Success to get destinations', res, data)
           }
        })
    } catch (error) {
        console.log(error)
    }
})

module.exports = router