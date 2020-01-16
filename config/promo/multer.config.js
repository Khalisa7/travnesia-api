const multer = require('multer')
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')
const s3 = require('../s3.config.js')
const fileExtension = require('file-extension')


const imageFilter = function (req, file, cb) {
  // accept image only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false)
  }
  cb(null, true)
}

// function for upload photo profile to S3 using multer and multer-s3 @restuhaqza
var upload = multer({
  fileFilter: imageFilter,
  size: 1024,
  storage: multerS3({
    s3: s3.s3Client,
    bucket: 'cdn.asia.myholiday.id',
    acl: 'public-read',
    fileFilter: imageFilter,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname,
        contentType: file.mimetype })
    },

    key: function (req, file, cb) {
      filename = Date.now().toString() + '-' + file.originalname
      cb(null, Buffer.from(filename).toString('base64').substr(0, 16) + '.' + fileExtension(file.originalname))
    } }
  ) })
module.exports = upload
