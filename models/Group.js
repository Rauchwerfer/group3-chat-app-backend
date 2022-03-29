const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: '',
    index: true
  },
  image: {
    type: String,
    required: false,
    default: null
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  ],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  moderators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Message',
      index: true
    }
  ]
}, { timestamps: true })

module.exports = mongoose.model('Group', groupSchema)