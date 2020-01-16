var express = require('express')
var router = express.Router()
var jwt = require('./../../../config/jwt_middleware/jwt')
var response = require('../../../common/response')
var modelUser = require('../../../models/customers/customerModel')
const s3 = require('../../../config/s3.config.js')
var upload = require('../../../config/user/multer.config')
var flag = require('../../../config/jwt_middleware/errorCode.json')

//module for check type of user
const ACL = require('../../../config/acl_middleware/acl_verify')


/**
 * Get Token Header
 * @method get
 * @param {object} headers
 * @return data
 * @public
 */
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
 * Get User Profile Data.
 * @method get
 * @param {object} req
 * @return json response
 * @public
 */
router.get('/profile/data', ACL.isUser, function (req, res) {
  var token = jwt.decode(getToken(req.headers))
  var userId = token.payload.u_id
  if (token) {
    modelUser.findOne({ u_id: userId }, function (err, data) {
      if (err || data == null) {
        response.error('Bad request', res, flag.unsupported_auth_token)
      } else {
        response.success('Success to fetch profile data', res, data)
      }
    }).select(['-_id', '-password','-hash','-u_group','-status','-_v'])
  } else {
    response.error('Unauthorized', res, {})
  }
})

/**
 * Save User Profile Data.
 * @method put
 * @param {object} req
 * @return json response
 * @public
 */
router.put('/profile/data', ACL.isUser, function (req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true })
  var u_id = token.payload.u_id
  let params = req.body

  if (token) {
    modelUser.findOneAndUpdate(
      { u_id: u_id },
      {
        $set: {
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
          address: params.address,
          city: params.city,
          country: params.country,
          province: params.province,
          postalCode: params.postalCode,
        }
      },
      { upsert: true },
      (err) => {
        if (err) return next(err)
        response.success('Success to Update Profile Data', res, {})
      }
    ).select(['-_id', '-password', '-_v'])
  } else {
    response.error('Unauthorized', res, { data })
  }
})

/**
 * Update Avatar Profile Data.
 * @method get
 * @param {object} req
 * @return json response
 * @public
 */
router.post('/profile/data/photo', ACL.isUser,function (req, res) {
  var token = jwt.decode(getToken(req.headers), { complete: true })
  var u_id = token.payload.u_id
  if (token) {
    modelUser.findOne({ u_id: u_id }, (err, data) => {
      let bucket_name = 'travnesia'
      s3.deleteFile('user/avatar/' + data.avatar, bucket_name)
    }).select(['avatar'])

    let singleUpload = upload.single('file')
    singleUpload(req, res, function (err, some) {
      if (err) {
        return response.error('Error type file incorrect', res, { error: err })
      }

      modelUser.updateOne(
        { u_id: u_id },
        { $set: { avatar: req.file.key } }, { upsert: true }, (err, res) => {
          if (err) {
            return response.error('error store to database but file success to upload', res, {})
          }
        })
      response.success('Success to Change Foto Profile', res, { keyname: req.file.location })
    })
  } else {
    response.error('Unauthorized', res, {})
  }
})

module.exports = router
