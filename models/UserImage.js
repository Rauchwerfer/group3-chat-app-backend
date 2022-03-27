const mongoose = require('mongoose')

const userImageSchema = new mongoose.Schema({
  imageBuffer: {
    type: Buffer,
    required: true
  },
  imageType: {
    type: String,
    required: true
  }
}, {timestamps: true})

module.exports = mongoose.model('UserImage', userImageSchema)