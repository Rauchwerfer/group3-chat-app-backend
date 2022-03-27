const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    max: 16,
    unique: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    max: 255,
    index: true,
    default: ''
  },
  tokens: [],
  password: {
    type: String,
    required: true,
    max: 128
  },
  confirmed: { // confirmable
    type: Boolean,
    default: false
  },
  confirmationToken: {
    type: String,
    default: ''
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  confirmationSentAt: {
    type: Date,
    default: null
  },
  unconfirmedEmail: {
    type: String,
    trim: true,
    lowercase: true,
    max: 255,
    default: ''
  },
  signInCount: {
    type: Number,
    default: 0
  },
  currentSignInAt: {
    type: Date,
    default: null
  },
  lastSignInAt: {
    type: Date,
    default: null
  },
  currentSignInIp: {
    type: String,
    default: ''
  },
  lastSignInIp: {
    type: String,
    default: ''
  },
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'    
    }
  ],
  status: {
    type: String,
    default: ''
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserImage'    
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)