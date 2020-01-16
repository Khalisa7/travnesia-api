var Midtrans = require('midtrans-nodex')

const key = new Midtrans({
  'clientKey': 'SB-Mid-client-bUON-GddIDOdmR7N',
  'serverKey': 'SB-Mid-server-5reGxw9abrndNPQQ8NiqcdDR',
  'isProduction': false
})

module.exports = {
  
  transaction: function (data) {
    const transaction = key.snap.transactions({
      'transaction_details': {
        'order_id': data.order_number,
        'gross_amount': data.total_due
      }
    })
    return transaction
  },

  status: function (orderId) {
    const status = key.transaction.status(orderId)
    return status
  }
}
