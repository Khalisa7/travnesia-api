var mail = require("../../../../config/mail/mailer")
var handlebars = require("handlebars")
var fs = require("fs")
/**
 * Read File Template HTML
 * @param {string} path 
 * @param {function} callback 
 * 
 * Note: for custom variabe in template you can use "{{ variabel }}" in HTML file
 */
var readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    })
}

var mailOrder = function (mailUser, fullName, data = {
    transaction_id: '',
    package_name: '',
    slug:'',
    package_date: '',
    total_pax: '',
    total_amount: ''
}) {
    try {
        readHTMLFile(__dirname + '/../../templates/vendors/order/mail_order.html', function (err, html) {
            if(err){
                console.log(err)
            }else{
            let template = handlebars.compile(html)
            let title = "[Tripdize] Order Masuk- " + data.transaction_id
            let text = "Order Masuk pemesanan paket perjalanan wisata melalui Tripdize,."
            let replacements = {
                title: title,
                logo: process.env.APP_LOGO,
                full_name: fullName,
                transaction_id: data.transaction_id,
                package_name: data.package_name,
                url: process.env.CLIENT_APP_URL + '/travel/detail/' + data.slug,
                url_order: process.env.CLIENT_APP_URL ,
                total_pax: data.total_pax,
                total_amount: data.total_amount
            }
            htmlToSend = template(replacements)
            mail.send(mailUser, title, text, htmlToSend)
            }
        })
    } catch (error) {
        console.log(error)
    }
}


var confirmPayment = function (mailUser, fullName, data = {
    transaction_id: '',
    package_name: '',
    slug: '',
    package_date: '',
    total_pax: '',
    total_amount: ''
}) {
    try {
        readHTMLFile(__dirname + '/../../templates/vendors/order/mail_confirm_payment.html', function (err, html) {
            if (err) {
                console.log(err)
            } else {
                let template = handlebars.compile(html)
                let title = "[Tripdize] Pembayaran Masuk - " + data.transaction_id
                let text = ""
                let replacements = {
                    title: title,
                    logo: process.env.APP_LOGO,
                    full_name: fullName,
                    transaction_id: data.transaction_id,
                    package_name: data.package_name,
                    url: process.env.CLIENT_APP_URL + '/travel/detail/' + data.slug,
                    url_order: process.env.CLIENT_APP_URL,
                    total_pax: data.total_pax,
                    total_amount: data.total_amount
                }
                htmlToSend = template(replacements)
                mail.send(mailUser, title, text, htmlToSend)
            }
        })
    } catch (error) {
    console.log(error)
}
}
module.exports = {
    mailOrder,
    confirmPayment
}