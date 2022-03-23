const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  checked: {
    type: Boolean,
    default:  false
  }
}, {timestamps: true})

module.exports = mongoose.model('Message', messageSchema)