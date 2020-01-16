var express = require('express')
var router = express.Router()
var ModelPromotion = require('../../../../models/promotion/promotionModel')
var response = require('../../../../common/response')
var upload = require('../../../../config/user/multer.config')
var uid = require('shortid')
const s3 = require('../../../../config/s3.config.js')
var upload = require('../../../../config/promo/multer.config')

/**
 * Get Slide Banner Promotions.
 * @method get
 * @param {object} req
 * @return json response
 * @public
 */
router.get('/promotion/slides', function (req, res) {
    ModelPromotion.find({ status: 1}, function(err, data){
        try{
            response.success("Succes to get slides", res, data)
        } catch (err){
            response.error('failed to get data', res, err)
        }
    }).select(['-_id', 'slide_id', 'name', 'redirect', 'image'])
})

router.post('/promotion/add-promo', function (req, res){

//     let singleUpload = upload.single('file')
//     singleUpload(req, res, function (err, some){
//         if (err) {
//             return response.error('Error type file incorrect', res, { error: err })
//           }
        
//         ModelPromotion.insert(
//             {image : req.file.key}, (err, ress)=>{
//                 if(err){
//                     return response.error('error store to database but file success to upload', res, {})
//                 }
//             }
//         )
//         response.success('success upload image promo', res, {})
// });
    
    // console.log(Date.now())
    var promo = new ModelPromotion({
            slide_id: uid.generate(),
            name: req.body.name,
            redirect: req.body.redirect,
            short_desc: req.body.short_desc,
            description: req.body.description,
            order: 0,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            image: req.body.image,
            published_at: Date.now(),
            update_at: Date.now(),
            status: 0
    })


    promo.save(function(err){
        if(err){
            response.error("Failed to add promo", res, {})
        }else{
            response.success("Success to add promo", res, {})
        }
    })

    

        // console.log(ModelPromotion)

    // console.log(promo)

    

    // console.log(addPromo.save)

})

module.exports = router