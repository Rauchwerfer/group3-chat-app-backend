const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
  imageBuffer: {
    type: String,
    required: true
  },
  imageType: {
    type: String,
    required: true
  }
}, {timestamps: true})

module.exports = mongoose.model('Image', imageSchema)