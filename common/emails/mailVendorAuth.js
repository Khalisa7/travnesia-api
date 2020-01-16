var mail = require("../../config/mail/mailer")
var handlebars = require("handlebars")
var fs = require("fs")

/**
 * @author: restuhaqza@gmail.com
 * @description: Mail Gateaway
 */


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

/**
 * Send Confirmation Mail Customers
 * @param {string} mailUser 
 * @param {string} fullName 
 * @param {string} linkActivated 
 */
var RegisVendor = function (mailUser, fullName, linkActivated) {
    readHTMLFile(__dirname + '/templates/vendors/register.html', function (err, html) {
        let template = handlebars.compile(html)
        let title = "[Tripdize] Pendaftaran Berhasil"
        let text = "Terima Kasih sudah mendaftar sebagai Pengguna Tripdize Apps."
        let replacements = {
            title: title,
            logo: process.env.APP_LOGO,
            full_name: fullName,
            url_confirmation: process.env.CLIENT_APP_URL + "/v/confirmation_email" + linkActivated
        }
        htmlToSend = template(replacements)

        mail.send(mailUser, title, text, htmlToSend)
        if (err) throw err
    })
}

var resetPassFirst = function (mailUser, fullName, linkResetPass) {
    readHTMLFile(__dirname + '/templates/vendors/forgot_password_step1.html', function (err, html) {
        let template = handlebars.compile(html)
        let title = "[Tripdize] Reset Password"
        let text = "Permintaan Reset Password Baru."
        let replacements = {
            title: title,
            logo: process.env.APP_LOGO,
            full_name: fullName,
            url_forgot_password: process.env.CLIENT_APP_URL + "/partner/reset_pass" + linkResetPass
        }
        htmlToSend = template(replacements)
        mail.send(mailUser, title, text, htmlToSend)
    })

}
// RegisUser('restuhaqza@gmail.com', 'Restu Haqqi Muzakir', "#")

module.exports = {
    RegisVendor,
    resetPassFirst
}