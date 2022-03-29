const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
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
}, {timestamps: true})

const Message = mongoose.model('Message', messageSchema)

const dialogueSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  ],
  messages: [messageSchema]
}, {timestamps: true})

const Dialogue = mongoose.model('Dialogue', dialogueSchema)

module.exports = {
  Dialogue: Dialogue,
  Message: Message
}