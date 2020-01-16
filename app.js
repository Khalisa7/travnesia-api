"use strict"
var fs = require("fs")
var express = require("express")
var app = express()
var path = require("path")
var cookieParser = require("cookie-parser")
var logger = require("morgan")
var mongoose = require("mongoose")
var passport = require("passport")
var config = require("./config/database")
var helmet = require("helmet")
var routes = require("./routes/routes")
var Response = require("./common/response")
var bodyParser = require("body-parser")
var jwtCheck = require('./config/jwt_middleware/jwt')
var cors = require("cors")
var es_index = require("./services/search_engine/indexing")
require("dotenv").config()

/**
 * Protect app from some well-known web
 * vulnerabilities by setting HTTP headers appropriately.
 * @public
 */
app.use(cors())
app.use(helmet())
app.disable("x-powered-by")
app.disable('etag')

/**
 * Create a write stream (in append mode)
 * Set morgan logging
 * @public
 */
var now = new Date()
var accessLogStream = fs.createWriteStream(
    path.join(
        __dirname,
        "/var/log/morgan/morganlog-" +
        now.getDate() +
        "-" +
        now.getMonth() +
        "-" +
        now.getFullYear() +
        ".log"
    ),
    { flags: "a" }
)


/**
 * Check onnection availability
 * @function isConnected
 */
function checkInternet(cb) {
    require('dns').lookup('google.com', function (err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
}

/**
 * Checking and Failover service
 * @function checkInternet
 */
checkInternet(function (isConnected) {
    if (isConnected) {
        console.log('\x1b[36m%s\x1b[0m', '\u2592 Connecting to Master Database Success')
        mongoose.connect(
            config.dev,
            { useNewUrlParser: true }
        )
        mongoose.set("useCreateIndex", true)
    } else {
        console.log('\x1b[31m', '\u2592 Connecting to Master Database Failed')
        console.log('\x1b[33m', 'You are using Slave Database: Local')
        mongoose.connect(
            config.local,
            { useNewUrlParser: true }
        )
        mongoose.set("useCreateIndex", true)
    }
});

// Initialize Passport
app.use(passport.initialize())

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")
app.use(express.static(path.join(__dirname, "public")))

//Loging Activity
app.use(logger("combined", { stream: accessLogStream }))

//JSON URL Encoded
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

//Use Cookies Parser
app.use(cookieParser())
/**
 * Set Cors Origin Headers for API.
 * @param {object} req
 * @return next()
 * @public
 */
app.use(function (req, res, next) {
    var origin = req.headers.origin
    var allowedOrigins = [
        "http://localhost:8001",
    ]
    if (allowedOrigins.indexOf(origin) >= 0) {
        res.setHeader("Access-Control-Allow-Origin", allowedOrigins)
        res.setHeader("Access-Control-Allow-Credentials", true)
        res.setHeader(
            "Access-Control-Allow-Headers",
            "X-Requested-With, Origin, Content-Type, Accept"
        )
    }
    next()
})


/**
 * Generate JSON Token.
 * @method get
 * @param {object} req
 * @return json response
 * @public
 */
app.get("/v1/app/validate", (req, res) => {
    if (req.headers['authorization'] !== 'Mbcp0FzR-J3Mjwh0E5Dq414nNYDCD5bcJa74') {
        Response.unauthorized("Unauthorized. An suspicious request has been logged.", res, {})
    } else {
        app.set('trust proxy', true)
        var visitors = req.ip
        var token = req.headers['x-api-key']
        var payload = { validate: true, ip: visitors }
        var generate = jwtCheck.sign(payload)
        var verify = jwtCheck.verify(token)
        Response.success("Ok", res, { userContext: generate, valid: verify.validate })
    }
})

/**
 * Public API Routes .
 * @method GET,POST,OPTIONS,PUT
 * @public
 */
app.use("/v1", [
    routes.cityControl,
    routes.getDestinations,
    routes.getEvents,
    routes.getProductTravel,
    routes.getPopularTravel,
    routes.mailSubs,
    routes.getPromotions,
    routes.getPayment,
    routes.elasticSearch,
    routes.vtMidtransStatus
])

// //Use validate token for routes below
// app.use(validateToken)

/**
 * Order and Checkout API Routes .
 * @method GET,POST,OPTIONS,PUT
 * @public
 */
app.use("/v1", [
    routes.orderCreate,
    routes.checkoutData,
    routes.paymentProcess,
    routes.getShoppingCart,
    routes.orderList,
])


/**
 * Customers API Routes .
 * @method GET,POST,OPTIONS,PUT
 * @public
 */
app.use("/v1/user", [
    routes.customersAuth,
    routes.getProfile
])

/**
 * Vendors API Routes .
 * @method GET,POST,OPTIONS,PUT
 * @public
 */
app.use("/v1/vendor", [
    routes.vendorsAuth,
    routes.vendorTransaction,
    routes.vendorProduct,
    routes.getVendor,
    routes.manageOrder
])

// // catch 404 and forward to error handler
// app.use(function (err, req, res, next) {
//     next()
// })


app.use("*", routes.indexRouter)

/**
 * Error Handler.
 * @public
 */
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get("env") === "development" ? err : {}
    // render the error page
    res.status(err.status || 500)

})


/**
 * Indexing Product to Elasticsearch every 15 minutes
 */
setInterval(es_index, 300000)
module.exports = app
