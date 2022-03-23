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
    required: true,
    default: ''
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
      body: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        default: 'String'
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
      }
    }, { timestamps: true }
  ]
}, {timestamps: true})

module.exports = mongoose.model('Group', groupSchema)