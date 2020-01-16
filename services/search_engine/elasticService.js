var client = require('./connection.js')
var express = require('express')
var router = express.Router()
var response = require('../../common/response')
var travelModel = require('../../models/travel/travelModel')
var bodybuilder = require('bodybuilder')

//API index for new collection in elasticsearch
/**
 * params in body
 * auth => token for access API,
 * index => name of index
 */
router.patch('/search/_index', function (req, res) {
    index = req.body.index || null
    auth = req.body.auth || null
    auth_key = 'U2VhcmNoIEVuZ2luZW55YSBUcmF2bmVzaWEK'
    if (auth == auth_key) {
        client.indices.create({ index: index },
            function (err) {
                if (err) {
                    return response.success(index + ' was success add to index', res, {})
                } else {
                    return response.success(index + ' success add to index', res, {})
                }
            })
    } else {
        response.error('API need authorization', res, {})
    }
})

//API bulk data for store many data in Package Travel to ES
/**
 * params in body
 * auth => token for access API
 */
router.patch('/search/_bulkdata', function (req, res) {
    auth_key = 'U2VhcmNoIEVuZ2luZW55YSBUcmF2bmVzaWEK'
    auth = req.body.auth || null
    if (auth == auth_key) {
        travelModel.aggregate([{
            $lookup: {
                from: 'destinations',
                localField: 'destination',
                foreignField: 'destination_id',
                as: 'destination'
            },
        }, {
            $lookup: {
                from: 'vendors',
                localField: 'vendor_id',
                foreignField: 'vendor_id',
                as: 'vendor'
            }
        }, {
            $unwind: '$destination'
        }, {
            $unwind: '$vendor'
        }, {
            $project: {
                _id: 0,
                id: '$_id',
                vendor: '$vendor.username',
                name: '$name',
                destination: '$destination.name',
                duration: '$duration',
                qty_minimum_booking: '$qty_minimum_booking',
                facility: '$facility',
                category: '$category',
                desc: '$id_shortdesc',
                base_price: '$base_price',
                hits: '$hits',
                image: '$image',
                fixed_date: '$fixed_date',
                slug: '$slug',
                status: '$status'
            }
        }]).exec(function (err, data) {
            if (err) return response.error('error guys', res, {})
            var bulk = []
            for (i = 0; i < data.length; i++) {
                bulk.push({
                    index: {
                        _index: 'travel',
                        _type: 'packages',
                        _id: data[i].id
                    }
                })
                bulk.push(data[i])
            }
            client.bulk({
                body: bulk
            })

            response.success('success store ' + data.length + ' to elasticsearch', res, data.length)
        })
    } else if (auth === null) {
        response.error('Unauthorized Token', res, {})
    } else {
        response.error('auth parameter body is missing', res, {})
    }
})


/**
 * Params : 
 * q => keyword
 * 
 * ==Sorting==
 * sort_price => sort packages by low or high price (LOW || HIGH)
 * popular => sorting data by hits (true)
 *
 * ==filter==
 * low_price => minimum price (default : 0)
 * high_price => maksimum price (default : 1000000000000)
 * 
 */
router.get("/product/travel/search", function (req, res) {
    var query = req.query.q || ""
    var sort_price = req.query.sort_price || null
    var popular = req.query.popular || null
    var low_price = req.query.low_price || 0
    var high_price = req.query.high_price || 1000000000000
    var page = parseInt(req.query.page) || 0

    var set_query_es = {
        index: 'travel',
        body: ''
    }

    set_query_es.body = bodybuilder().query('query_string', 'query', '*' + query + '*').filter('terms', 'status', ['1', '2'])

    //set query by base_price
    if (low_price && high_price) {
        set_query_es.body = set_query_es.body.query("range", "base_price", { gte: low_price, lte: high_price })
    }

    let sort = []
    let sorting = false
    // sorting data by base price
    if (sort_price == 'LOW') {
        sorting = true
        sort.push({ base_price: 'asc' })
    } else if (sort_price == 'HIGH') {
        sorting = true
        sort.push({ base_price: 'desc' })
    }


    //sorting data by popular
    if (popular == 'true') {
        sorting = true
        sort.push({ hits: 'desc' })
    }
    if (sorting == true) {
        set_query_es.body = set_query_es.body.sort(sort)
    }

    if (page > 0) {
        set_query_es.body = set_query_es.body.from(page)
    }

    set_query_es.body = set_query_es.body.size(15).build()
    client.search(set_query_es, function (err, resp) {
	console.log(err);
        if (err) return response.error('failed connect to service', res, {})
        else if (resp) {
            var result = []
            for (i = 0; i < resp.hits.hits.length; i++) {
                result.push(resp.hits.hits[i]._source);
            }
            return response.success('success', res, { data: result })
        }
    })

    // response.success('your keyword is ' + query, res, {})
})

module.exports = router 
