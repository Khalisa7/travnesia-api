var express = require('express')
var router = express.Router()

/* GET Index page. */
router.get('/', function (req, res, next) {
    res.status(401).send({ success: false, msg: 'Bad Request' })
})

/* GET Index page. */
router.post('/', function (req, res, next) {
    res.status(401).send({ success: false, msg: 'Bad Request' })
})

module.exports = router
