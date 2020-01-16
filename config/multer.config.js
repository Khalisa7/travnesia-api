const multer = require('multer')

var storage = multer.memoryStorage()
var upload = multer(
  { storage: storage },
  { limits: { fieldNameSize: 10, fieldSize: 2 } })

module.exports = upload
