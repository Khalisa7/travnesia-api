
module.exports = {
  error: function (message, res, code) {
    let response = res.status(500).json({ message: message, success: 0, statusCode: 500, flag: code })
    return response
  },
  success: function (message, res, data) {
    let response = res.status(201).json({ message: message, success: 1, statusCode: 200, result: data })
    return response
  },
  notFound: function (message, res) {
    let response = res.status(404).json({ message: message, success: 0, statusCode: 404, result: {} })
    return response
  },
  unauthorized: function (message, res, code) {
    let response = res.status(401).json({ message: message, success: 0, statusCode: 401, flag: code })
    return response
  },
  forbidden: function (message, res, code) {
    let response = res.status(403).json({ message: message, success: 0, statusCode: 403, flag: code })
    return response
  },
  send: function (res, code, message, addtional) {
    let response = res.status(code).json({
      message: message, success: function (code) {
        if (code < 400) {
          return 1
        } else {
          return 0
        }
      },
      statusCode: code,
      result: addtional
    })
    return response
  }
}
