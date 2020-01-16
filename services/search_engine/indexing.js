var client = require('./connection.js')
var travelModel = require('../../models/travel/travelModel')
function indexing(){
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
        if (err) return console.log("Search Engine failed to update")
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
        console.log("Search Engine Updated :", Date())
    })
}

module.exports = indexing