const mongoose = require('mongoose')

const dialogueSchema = new mongoose.Schema({
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
      },
      checked: {
        type: Boolean,
        default:  false
      }
    }, { timestamps: true }
  ]
}, {timestamps: true})

module.exports = mongoose.model('Dialogue', dialogueSchema)