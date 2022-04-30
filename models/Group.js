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
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    default: null
  }],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  reply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    index: true
  }
}, { timestamps: true })

const Message = mongoose.model('Message', messageSchema)

const lastVisitSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Group',
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  lastActiveAt: {
    type: Date,
    default: new Date(),
    required: true
  }
});

const LastVisit = mongoose.model('LastVisit', lastVisitSchema)

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: '',
    index: true
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
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
      ref: 'Message',
      index: true
    }
  ],
  lastVisited: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LastVisit',
      index: true
    }
  ]
}, { timestamps: true })

const Group = mongoose.model('Group', groupSchema)

module.exports = {
  Group: Group,
  Message: Message,
  LastVisit: LastVisit
}