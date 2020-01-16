var express = require('express')
var router = express.Router()
var response = require('../../../common/response')
var modelEvent = require('../../../models/events/eventModel')
const s3 = require('../../../config/s3.config.js')
// var upload  = require('../../../cofig/user/multer.config')

router.get('/event/list', function (req, res) {
    modelEvent.aggregate([
        {
            $lookup: {
                from: 'vendors',
                localField: 'vendor_id',
                foreignField: 'u_id',
                as: 'event_owner'
            }
        }, {
            $lookup: {
                from: 'event_tickets',
                localField: 'event_id',
                foreignField: 'event_id',
                as: 'event_tickets_info'
            }
        }, {
            $unwind: "$event_owner"
        }, {
            $unwind: "$event_tickets_info"
        }, {
            $project: {
                _id: 0,
                name: "$name",
                id_shortdesc: "$id_shortdesc",
                en_shortdesc: "$en_shortdesc",
                an_shortdesc: "$an_shortdesc",
                zh_shortdesc: "$zh_shortdesc",
                lowerprice: "$lower_price",
                vendor: "$vendor_id",
                image: "$image",
                location: "$location",
                slug: "$slug",
                datetime: "$date_time",
                eventowner: {
                    vendorname: "$event_owner.firstName",

                },
                eventticket: {
                    date_selling: "$event_tickets_info.date_selling",
                    end_selling: "$event_tickets_info.end_selling",
                    special_date: "$event_tickets_info.special_date",
                    special_price: "$event_tickets_info.special_price",
                }
            }
        }, {
            $limit: 6
        }
    ]).exec(function (err, data) {
        if (err) return next(err)
        response.success("Events has been listed", res, data)
    }).select('-_id');
})

module.exports = router
