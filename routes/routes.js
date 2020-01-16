/* Sites Routes API */
var indexRouter = require("../core/default/index")
var getDestinations = require("../core/sites/travel/destinationController")
var getProductTravel = require("../core/sites/travel/productController")
var getPopularTravel = require("../core/sites/travel/popularPackage")
var getPromotions = require("../core/sites/promotions/controller/getPromotions")
var getPayment = require("../core/orders/payment/getPayment")
var cityControl = require("../core/sites/city/cityController")

/* Payment Routes API */
var paymentProcess = require("../services/payment/midtrans/code/getSnapToken")
var vtMidtransStatus = require('../services/payment/midtrans/code/callBack')

/* Customers Routes API */
var customersAuth = require("../core/customers/auth/auth")
var getProfile = require("../core/customers/profile/profileData")

/* Order Proccess API */
var getShoppingCart = require("../core/orders/shoppingcart/getShoppingCart")
var checkoutData = require("../core/orders/salesorder/checkoutData")
var orderCreate = require("../core/orders/salesorder/createOrder")


/* History order API */
var orderList = require("../core/orders/salesorder/orderList")


/* Vendors Routes API */
var vendorsAuth = require("../core/vendors/auth/auth")
var vendorTransaction = require ('../core/vendors/transaction/transactionController')
var vendorProduct = require("../core/vendors/products/manageProduct")
var getVendor = require("../core/vendors/profile/profileData")
var manageOrder = require('../core/vendors/order/manageOrder')

/* Mail Subscribe API */
var mailSubs = require("../services/subscribe/mailSubscribe")

/* Events and it tickets Routes API */
var getEvents = require('../core/sites/events/eventController')

/*Search Engine API - Elasticsearch*/
var elasticSearch = require('../services/search_engine/elasticService')

module.exports = {
    indexRouter,
    getEvents,
    customersAuth,
    cityControl,
    getProductTravel,
    getPopularTravel,
    getDestinations,
    getProfile,
    vendorsAuth,
    vendorProduct,
    getVendor,
    orderCreate,
    paymentProcess,
    getShoppingCart,
    getPromotions,
    mailSubs,
    checkoutData,
    getPayment,
    elasticSearch,
    checkoutData,
    vtMidtransStatus,
    orderList,
    vendorTransaction,
    manageOrder
}
