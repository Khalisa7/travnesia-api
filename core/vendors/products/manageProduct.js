"use strict"
const express = require('express')
const router = express.Router()
const modelProduct = require('../../../models/travel/travelModel')
const modelItinerary = require('../../../models/travel/itineraryModel')
const modelCategory = require('../../../models/travel/categoryModel')
const modelDestination = require('../../../models/destination/destinationModel')
const response = require('../../../common/response')
const middleware = require('../../../config/jwt_middleware/middleware')
const jwt = require('../../../config/jwt_middleware/jwt')
const md5 = require('../../../config/crypto/md5')

const upload = require('../../../config/upload_engine/multer.config')
const s3 = require('../../../config/s3.config')

var es_index = require('./../../../services/search_engine/indexing')


//import module for check user type
const ACL = require('./../../../config/acl_middleware/acl_verify')

/**
 * Remember : Status Package is
 * 0. Review
 * 1. Active
 * 2. Deactive
 * 3. Delete
 */

String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for (var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

var getToken = function (headers) {
    if (!headers) {
        return false
    } else {
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
}

/**
 * API Product Category
 */
router.get('/travel/product/category', middleware, ACL.isVendor, (req, res) => {
    try {
        modelCategory.find({}, { _id: 0, category_id: 1, name: 1, description: 1 }, (err, data) => {
            if (err) {
                return response.error('Error when get data', res, err)
            } else if (!data) {
                return response.notFound('not listed category', res, {})
            } else {
                return response.success('success get listed category', res, data)
            }
        })
    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, {})
    }
})


router.get('/travel/product/destination', middleware, ACL.isVendor, (req, res)=>{
    try {
        modelDestination.find({}, { _id: 0, destination_id: 1, name: 1, description: 1 }, (err, data) => {
            if (err) {
                return response.error('Error when get data', res, err)
            } else if (!data) {
                return response.notFound('not listed destination', res, {})
            } else {
                return response.success('success get listed destination', res, data)
            }
        })
    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, {})
    }
})
router.post('/travel/product/image', middleware, ACL.isVendor, function (req, res) {
    try {
        let upload_image = upload.imageTravel.single("file")
        if (upload_image) {

            try {
                upload_image(req, res, function (err, next) {
                    if (err) {
                        return response.error('Error type file incorrect', res, { error: err })
                    }
                    let file_name = req.file.key || null
                    return response.success("success", res, { image_name: file_name })
                })
            } catch (error) {
                console.log(error)
            }
        } else {
            response.error("cannot be applied", res, { image_name: null })
        }
    } catch (error) {
        console.log(error)
    }
})

/**
 * API for add travel product on vendor dashboard
 */
router.post('/travel/product', middleware, ACL.isVendor, (req, res) => {
    try {
        var token = jwt.decode(getToken(req.headers))
        var vendorId = token.payload.u_id
        if (token) {

            let random_plain_text = "abcdefghijklmnopqrstuvwxyz1234567890".repeat(5).shuffle()
            let product_id = random_plain_text.substr(0, 8)
            let sku_product = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".repeat(5).shuffle().substr(0, 5) + Math.floor(Math.random() * 100)
            let slug = (req.body.title).split(" ").join("-") + "-" + random_plain_text.substr(0 - 5)
            let guarantee = ""
            let facilities = ""
            let open_date = 0

            let duration = req.body.day_duration + "D" + req.body.night_duration + "N"


            //parameter in guarantee
            if (req.body.guarantee_1) {
                guarantee += 'refund,'
            }
            if (req.body.guarantee_2) {
                guarantee += 'e-voucher,'
            }
            if (req.body.guarantee_3) {
                guarantee += 'flexible,'
            } if (req.body.guarantee_4) {
                guarantee += 'fastcheckin'
            }

            guarantee = guarantee.split(",")
            guarantee.pop()
            guarantee = guarantee.join(",")


            //parameter in facility
            if (req.body.facility_1) {
                facilities += 'tour_guide,'
            }
            if (req.body.facility_2) {
                facilities += 'hotel,'
            }
            if (req.body.facility_3) {
                facilities += 'transportation,'
            }
            if (req.body.facility_4) {
                facilities += 'meals,'
            }
            if (req.body.facility_5) {
                facilities += 'ticket,'
            }
            if (req.body.facility_6) {
                facilities += 'flight_1,'
            }
            if (req.body.facility_7) {
                facilities += 'flight_2_ways,'
            }
            if (req.body.facility_8) {
                facilities += 'baggage,'
            }

            if (req.body.tour_type == "open") {
                open_date = open_date + 1
            }
            facilities = facilities.split(",")
            facilities.pop()
            facilities = facilities.join(",")

            //parameter for query add to product
            let product = new modelProduct({
                product_id: product_id || "",
                vendor_id: vendorId,
                image: req.body.image,
                destination: req.body.destination || "",
                duration: duration || "",
                name: req.body.title || "",
                category: req.body.category || "",
                id_shortdesc: req.body.id_shortdesc || "",
                id_desc: req.body.id_desc || "",
                base_price: req.body.base_price || "",
                guarantee: guarantee,
                facility: facilities,
                slug: slug,
                qty_minimum_booking: parseInt(req.body.qty_minimum_booking),
                stock: req.body.stock || "",
                pickup_location: req.body.pickup_location || "",
                open_date_start: req.body.open_date_start || "",
                open_date_end: req.body.open_date_end || "",
                sku: sku_product,
                open_date: open_date,
                created_at: Date.now(),
                published_at: Date.now(),
                hits: 0,
                point: 0,
                status: 0
            })

            product.save(function (err, parameter) {
                if (err) {
                    return response.error("failed to add package", res, { error: err })
                } else {
                    let itenerary = []
                    let day_duration = parseInt(req.body.day_duration)
                    for (let i = 0; i < day_duration; i++) {
                        itenerary.push({
                            parent_id: parameter.product_id,
                            day: parseInt(i + 1),
                            description: req.body.itenerary[i],
                            slug: parameter.slug,
                        })
                    }
                    modelItinerary.insertMany(itenerary, (err, data) => {
                        if (err) {
                            console.log(err)
                        }
                        return
                    })
                    es_index() //update search engine
                    return response.success("success add data", res, {})
                }
            })
        } else {
            response.error('Unauthorized', res, {})
        }
    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, {})
    }

})

/**
 * API update product
 */
router.put('travel/product/:slug', middleware, ACL.isUser, (req, res) => {
    try {
        var token = jwt.decode(getToken(req.headers))
        var vendorId = token.payload.u_id
        if (token) {
            let guarantee = ""
            let facilities = ""
            let open_date = 0
            let duration = req.body.day_duration + "D" + req.body.night_duration + "N"


            //parameter in guarantee
            if (req.body.guarantee_1) {
                guarantee += 'refund,'
            }
            if (req.body.guarantee_2) {
                guarantee += 'e-voucher,'
            }
            if (req.body.guarantee_3) {
                guarantee += 'flexible,'
            } if (req.body.guarantee_4) {
                guarantee += 'fastcheckin'
            }

            guarantee = guarantee.split(",")
            guarantee.pop()
            guarantee = guarantee.join(",")


            //parameter in facility
            if (req.body.facility_1) {
                facilities += 'tour_guide,'
            }
            if (req.body.facility_2) {
                facilities += 'hotel,'
            }
            if (req.body.facility_3) {
                facilities += 'transportation,'
            }
            if (req.body.facility_4) {
                facilities += 'meals,'
            }
            if (req.body.facility_5) {
                facilities += 'ticket,'
            }
            if (req.body.facility_6) {
                facilities += 'flight_1,'
            }
            if (req.body.facility_7) {
                facilities += 'flight_2_ways,'
            }
            if (req.body.facility_8) {
                facilities += 'baggage,'
            }

            if (req.body.tour_type == "open") {
                open_date = open_date + 1
            }
            facilities = facilities.split(",")
            facilities.pop()
            facilities = facilities.join(",")

            //parameter for query add to product
            let product = {
                destination: req.body.destination,
                duration: duration ,
                name: req.body.title,
                category: req.body.category,
                id_shortdesc: req.body.id_shortdesc,
                id_desc: req.body.id_desc,
                base_price: req.body.base_price,
                guarantee: guarantee,
                facility: facilities,
                qty_minimum_booking: parseInt(req.body.qty_minimum_booking),
                stock: req.body.stock,
                pickup_location: req.body.pickup_location,
                open_date_start: req.body.open_date_start,
                open_date_end: req.body.open_date_end,
                sku: sku_product,
                open_date: open_date,
                update_at: Date.now(),
                hits: 0,
                point: 0,
                status: 0
            }

            modelProduct.findOneAndUpdate(
                { slug: req.params.slug, vendor_id: vendorId }, product,
                (error, data) => {
                    if(error){
                        return Response.error('Error Update Profile', res, error)
                    }else if(!data){
                        return Response.notFound('Data not found', res, {})
                    }else{
                        return Response.success('Success update data', res,{})
                    }
                }
            )

            // product.save(function (err, parameter) {
            //     if (err) {
            //         return response.error("failed to add package", res, { error: err })
            //     } else {
            //         let itenerary = []
            //         let day_duration = parseInt(req.body.day_duration)
            //         for (let i = 0; i < day_duration; i++) {
            //             itenerary.push({
            //                 parent_id: parameter.product_id,
            //                 day: parseInt(i + 1),
            //                 description: req.body.itenerary[i],
            //                 slug: parameter.slug,
            //             })
            //         }
            //         modelItinerary.insertMany(itenerary, (err, data) => {
            //             if (err) {
            //                 console.log(err)
            //             }
            //         })
            //         return response.success("success add data", res, {})
            //     }
            // })
        } else {
            response.error('Unauthorized', res, {})
        }
    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, {})
    }
})

/**
 * Get list package / product in Vendor Dashboard
 * @param {status} "active" and "deactive"
 * when status is null or disabled, data will be return all package
 */
router.get('/travel/product', middleware, ACL.isVendor, function (req, res) {
    try {
        var token = jwt.decode(getToken(req.headers))
        var vendorId = token.payload.u_id
        var status = req.query.status
        if (token) {
            let query = { vendor_id: vendorId }
            if (status == "active") {
                query.status = 1
            } else if (status == "deactive") {
                query.status = 0
            }
            console.log(query)
            modelProduct.find(query, {
                product_id: 1,
                image: 1,
                name: 1,
                slug: 1,
                id_shortdesc: 1,
                facilitiy: 1,
                stock: 1,
                base_price: 1,
                status: 1
            }, (error, data) => {
                if (error) {
                    return response.error('something wrong', res, { error: error })
                } else if (!data) {
                    return response.notFound('package list not found')
                } else {
                    if (data.status == 1) {
                        status_package = "active"
                    } else if (data.status == 0) {
                        status_package = "deactive"
                    }
                    return response.success('success get package list data', res, data)
                }
            })
        }
    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, {})
    }
})

router.get('/travel/product/:slug', middleware, ACL.isVendor, function (req, res) {
    try {
        var token = jwt.decode(getToken(req.headers))
        var vendorId = token.payload.u_id
        if (token) {
            modelProduct.aggregate([
                {
                    $match: { vendor_id: vendorId, slug: req.params.slug }
                }, {
                    $lookup: {
                        from: 'itinerary',
                        localField: 'product_id',
                        foreignField: 'parent_id',
                        as: 'itinerarylist'
                    }
                }, {
                    $project: {
                        _id: 0,
                        product_id: '$product_id',
                        image: '$image',
                        destination: '$destination',
                        duration: '$duration',
                        name: '$name',
                        category: '$category',
                        id_shortdesc: '$id_shortdesc',
                        id_desc: '$id_desc',
                        base_price: '$base_price',
                        facility: '$facility',
                        guarantee: '$guarantee',
                        slug: '$slug',
                        qty_minimum_booking: '$qty_minimum_booking',
                        stock: '$stock',
                        pickup_location: '$pickup_location',
                        open_date_start: '$open_date_start',
                        open_date_end: '$open_date_end',
                        sku: '$sku',
                        open_date: '$open_date',
                        created_at: '$created_at',
                        published_at: '$published_at',
                        itinerary: "$itinerarylist",
                    }
                }
            ], function (err, data) {
                if (err) {
                    return response.error("error when get data", res, err)
                } else if (!data) {
                    return response.notFound('data not found', res, {})
                } else {
                    return response.success('successed fetch all data, mau apa lokill', res, data)
                }
            })
        } else {
            return response.error('Unauthorized', res, {})
        }

    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, error)
    }
    // return response.success("success using slug", res, {slug: req.params.slug})

})

router.delete('/travel/product/:slug', middleware, ACL.isVendor, (req, res) => {
    try {
        var token = jwt.decode(getToken(req.headers))
        var vendorId = token.payload.u_id
        if (token) {
            let slug = req.params.slug
            /* never delete data in production only change status from 1 (active) to 3 (deleted)
            modelProduct.findOneAndDelete({ slug: slug, vendor_id: vendorId }, function (error, data) {
                if (error) {
                    response.error("error, have an problem", res, {})
                } else if (!data) {
                    return response.notFound('package not found', res, {})
                } else {
                    modelItinerary.deleteMany({ vendor_id: vendorId, slug: slug }, function (error) {
                        if (error) {
                            return console.log(error)
                        }
                        return
                    })
                    return response.success("success delete a data", res, {})
                }
            })
            */

            modelProduct.findOneAndUpdate({ slug: slug, vendor_id: vendorId }, { status: 3 }, (error, data) => {
                if (error) {
                    return response.error('error when get a data', res, error)
                } else if (!data) {
                    return response.notFound('package not found', res, {})
                } else {
                    return response.success('success delete a data', res, {})
                }
            })
        }
    } catch (error) {
        console.log(error)
        return response.error('cannot be applied', res, {})
    }
})


module.exports = router