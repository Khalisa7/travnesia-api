var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

//setup csrf middleware
var csrf = require('csurf')
var csrfProtection = csrf({ cookie: true})
var parseFrom = bodyParser.urlencoded({ extended: false })