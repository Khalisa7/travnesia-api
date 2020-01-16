var express = require('express')
var router = express.Router()
var jwt = require('./../../../config/jwt_middleware/jwt')
var ModelUser = require('../../../models/customers/customerModel')
var ModelSession = require('../../../models/sessions/insertSession')
var response = require('../../../common/response')
var uid = require('shortid')
var MailGateaway = require("../../../common/emails/mailCustomerAuth")
var md5 = require("../../../config/crypto/md5")
var middleware = require('./../../../config/jwt_middleware/middleware')
var bcrypt = require('bcrypt-nodejs')

/**
 * Email Validation
 * @param {String} email 
 */
function validateEmail(email) {
  // First check if any value was actually set
  if (email.length == 0) return false;
  // Now validate the email format using Regex
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
  return re.test(email);
}

/**
 * User Registration.
 * @method post
 * @param {object} req
 * @return json response
 * @public
 */
router.post('/signup', middleware, function (req, res) {
  if (!req.body.username || !req.body.password) {
    response.error('Username and Password is required.', res, {})
  } else {
    if (!validateEmail(req.body.username)) {
      return response.error("Your Email is not valid", res, { msg: "invalid_email" })
    } else if (req.body.password.length < 8) {
      return response.error("Your password is too short at least 8 characters", res, { msg: "short_pass" })
    }
    var regUser = new ModelUser({
      u_id: uid.generate(),
      username: req.body.username,
      password: req.body.password,
      first_name: req.body.firstname,
      last_name: req.body.lastname,
      avatar: 'default.png',
      is_verified: 0,
      hash: md5(req.body.username, "SGFzaCBmb3IgQ29uZmlybWF0aW9uIEVtYWlsCg=="),
      u_group: 1,
      status: 0,
      reg_date: Date.now()
    })

    regUser.save(function (err, data) {
      if (err) {
        if (err.code !== 11000) {
          response.error(err, res)
        } else {
          response.error('Account with ' + req.body.username + ' already exist.', res, { msg: "mail_was_registered" })
        }
      } else {
        let linkConfirmation = "?resource=" + Buffer.from(data.u_id).toString('base64') + "&locator=" + md5(uid.generate()) + "&hash=" + data.hash
        MailGateaway.RegisUser(req.body.username, req.body.firstname + " " + req.body.lastname, linkConfirmation) //send confirmation mail
        response.success('Registration Success!', res, {})
      }
    })
  }
})

/**
 * Mail Confirmation
 * @method POST
 * @param {string} resource in body
 * @param {string} hash in body
 * @return json response
 * @public
 */
router.post('/confirmation_mail', middleware, function (req, res) {
  var u_id = Buffer.from(req.body.resource || "", "base64").toString('ascii') || null
  var hash_user = req.body.hash || null
  if (u_id !== null && hash_user !== null) {
    ModelUser.findOneAndUpdate({
      u_id: u_id,
      hash: hash_user
    },
      {
        hash: md5(uid.generate(), "SGFzaCBmb3IgQ29uZmlybWF0aW9uIEVtYWlsCg=="),
        status: 1,
        is_verified: 1,
      }, function (err, data) {
        if (err) {
          return response.error('Failed connect to service', res, {})
        } else if (!data) {
          return response.error('Failed for verification email', res, {})
        }
        response.success('success', res, { msg: "mail_activated" })
      })
  }
})

/**
 * Reset Password Step 1 - Send Mail
 * @param {string} email
 * @return json response
 * @public
 */
router.post('/password', middleware, function (req, res) {
  let email = req.body.email || null
  if (email == null) {
    return response.error("Email is empty", res, { msg: "empty_email" })
  } else if (!validateEmail(email)) {
    return response.error("Email is not valid", res, { msg: "invalid_email" })
  } else {
    hash_user = md5(uid.generate(), "SGFzaCBmb3IgQ29uZmlybWF0aW9uIEVtYWlsCg==")
    ModelUser.findOneAndUpdate({
      username: email
    }, {
        hash: hash_user
      }).exec(function (err, data) {
        if (err) {
          return response.error('Failed Connect to service', res, {})
        } else if (!data) {
          return response.notFound("Email not found", res)
        } else {
          let linkForgotPass = "?resource=" + Buffer.from(data.u_id).toString('base64') + "&locator=" + md5(uid.generate()) + "&hash=" + hash_user
          MailGateaway.resetPassFirst(email, data.first_name + " " + data.last_name, linkForgotPass)
          return response.success("Email was sent to " + data.username + ", please check your email", res, {})
        }
      })

  }
})


/**
 * Reset Password Step 2 - Change Password
 * @param {string} resource
 * @param {string} hash
 * @param {string} email (optional)
 * @param {string} password
 * @param {string} retype_password
 * @return {string} json response
 */
router.post('/_password', middleware, function (req, res) {
  let u_id = Buffer.from(req.body.resource || "", "base64").toString('ascii') || null
  let hash_user = req.body.hash || null
  let email = req.body.email
  let password = req.body.password
  let retype_password = req.body.retype_password
  if (u_id === null && hash_user === null) {
    return response.unauthorized('Unathorized, Access Denied', res)
    // } else if (!validateEmail(email)) {
    //   return response.error("Email is not valid", res, { msg: "invalid_email" })
  } else if (password !== retype_password) {
    return response.error('Password Invalid', res, { msg: "invalid_password" })
  } else if (u_id && hash_user && password && retype_password) {
    ModelUser.findOne({
      u_id: u_id,
      // username: email,
      hash: hash_user
    }, function (err, data) {
      if (err) {
        return response.error('Failed Connect to Service', res, {})
      } else if (!data) {
        return response.notFound('invalid user', res, {})
      } else {
        data.password = password
        data.hash = md5(uid.generate(), "SGFzaCBmb3IgQ29uZmlybWF0aW9uIEVtYWlsCg==")
        data.save()
        return response.success('success', res, { msg: "password_changed" })
      }
    })
  } else {
    return response.error('Paramemter Invalid', res, {})
  }
})

/**
 * Request for Login Authentication.
 * @method post
 * @param {object} req
 * @return json response
 * @public
 */
router.post('/signin', middleware, function (req, res) {
  ModelUser.findOne({
    username: req.body.username
  }, function (err, user) {
    if (err) throw err
    if (!user) {
      response.error('Authentication failed. User not found.', res)
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          var token = jwt.sign({ validate: true, ip: req.ip, u_id: user.u_id, user: user.first_name, type: 'user' })
          var thisSession = new ModelSession({
            u_id: user.u_id,
            user: 'user',
            jwt_token: token,
            is_blacklist: 0
          })
          thisSession.save(function () {
            response.success(true, res, token)
          })
        } else {
          response.notFound('Invalid Email Id or Password!', res)
        }
      })
    }
  })
})

/**
 * User Logout. Revoke JSON Token.
 * @method get
 * @param {object} req
 * @return json response
 * @public
 */
router.get('/logout', middleware, function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      response.error(err.message, res)
    } else {
      response.success('User logged out successfully!', res, {})
    }
  })
})

module.exports = router
