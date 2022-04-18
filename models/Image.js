const mongoose = require('mongoose')
const User = require('./User');

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

imageSchema.pre('remove', async function(next) {
  const user = await User.findOneAndUpdate({ image: this._id }, {
    $set: {
      image: null
    }
  }, {
    returnDocument: 'after'
  }).exec()
  next();
});

module.exports = mongoose.model('Image', imageSchema)