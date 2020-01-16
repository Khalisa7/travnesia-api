var mailModel = require("../../models/config/mailSubscribe")
var express = require("express")
var router = express.Router()
var response = require("../../common/response")

router.post("/subscribe/email", function(req, res) {
    if (!req.body.fullname || !req.body.email) {
        response.error("Fullname and Email is Required", res)
    } else {
        email = req.body.email
        fullname = req.body.fullname

        mailReg = new mailModel({
            fullname: fullname,
            email: email,
            sub_date: Date.now(),
            status: 1
        })

        mailReg.save(function(err) {
            if (err) {
                response.error("Email " + email + " has been subscribed", res)
            } else {
                var sendNotification = function(data) {
                    var headers = {
                        "Content-Type": "application/json; charset=utf-8",
                        Authorization:
                            "Basic OWQ0ZTdjNDMtNmJhYy00YWMwLTk2ZTUtYmNlNWQ0YjM4MTZk"
                    }

                    var options = {
                        host: "onesignal.com",
                        port: 443,
                        path: "/api/v1/notifications",
                        method: "POST",
                        headers: headers
                    }

                    var https = require("https")
                    var req = https.request(options, function(res) {
                        res.on("data", function(data) {
                            // console.log("Response:")
                            // console.log(JSON.parse(data))
                        })
                    })

                    req.on("error", function(e) {
                        // console.log("ERROR:")
                        // console.log(e)
                    })

                    req.write(JSON.stringify(data))
                    req.end()
                }

                var message = {
                    app_id: "762ecaf5-ab0f-408f-aeef-0f0923a161e7",
                    include_email_tokens: [email],
                    email_subject: "Subscribed Success",
                    template_id: "d8f8ed80-da7b-4df3-afaf-1da25afe0c0c"
                }

                sendNotification(message)
                response.success("Email has registered", res)
            }
        })
    }
})

module.exports = router
