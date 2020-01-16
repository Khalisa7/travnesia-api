const AWS = require('aws-sdk')
const env = require('./s3.env.js')

const s3Client = new AWS.S3({
  accessKeyId: env.AWS_ACCESS_KEY,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.REGION
})

// console.log(s3Client)

const uploadParams = {
  Bucket: env.Bucket,
  Key: 'test_img', // pass key
  Body: null, // pass file body
  ContentEncoding: 'base64',
  ContentType: 'image/jpeg',
  ACL: 'public-read'
}

const deleteFile = function (deletefile, bucket) {
  s3Client.deleteObject({ Key: deletefile, Bucket: bucket }, (err, data) => {
    if (data) {
      console.log('File deleted successfully')
    } else {
      console.log('Check if you have sufficient permissions : ' + err)
    }
  })
}

const s3 = {}
s3.s3Client = s3Client
s3.uploadParams = uploadParams
s3.deleteFile = deleteFile

module.exports = s3
