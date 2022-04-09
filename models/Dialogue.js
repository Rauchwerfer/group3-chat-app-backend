const mongoose = require('mongoose');
const User = require('./User');

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

dialogueSchema.pre('save', async function(next) {
  console.log(this)
  this.participants.forEach(async (participant) => {
    await User.findByIdAndUpdate(participant, { $push: { dialogues: this._id }}).exec()
  });
  next();
});

dialogueSchema.pre('remove', async function(next) {
  console.log(this)
  console.log(this.participants)
  this.participants.forEach(async (participant) => {
    await User.findByIdAndUpdate(participant, { $pull: { dialogues: this._id }}).exec()
  });
  next();
});

module.exports =  mongoose.model('Dialogue', dialogueSchema)