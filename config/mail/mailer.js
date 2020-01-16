"use strict"
const nodemailer = require("nodemailer")

//nodemailer using sendgrid for mail gateaway
function send(to, subject, text, html) {
    var transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "bpc_amikom", // generated ethereal user
            pass: "Black2017" // generated ethereal password
        }
    })

    // setup email data with unicode symbols
    var mailOptions = {
        from: '"Tripdize Indonesia" <no-reply@tripdize.com>', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html
    }

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error)
        }
        console.log("Message sent: %s", info.messageId)
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    })
}

module.exports = { send }
