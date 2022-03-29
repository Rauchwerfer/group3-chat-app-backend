const express = require('express')
const router = express.Router()

const { Dialogue } = require('../models/Dialogue')
const { Message } = require('../models/Dialogue')

const { authenticateToken, authorizeClient } = require('../AuthMiddleware')
const { mongoose } = require('mongoose')

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    //res.locals.userId

    const checkIfDialogueExists = await Dialogue.findOne({
      participants: { $all: [req.query.companionUserId, req.query.currentUserId] }
    }).populate('messages.sender', ['username'/* , 'email' */])
    if (checkIfDialogueExists != null) {
      return res.status(200).json({
        dialogueId: checkIfDialogueExists._id,
        messages: checkIfDialogueExists.messages
      })
    } else {
      const newDialogue = new Dialogue({
        participants: [req.query.companionUserId, req.query.currentUserId]
      })
      const savedDialogue = await newDialogue.save()
      return res.status(200).json({
        dialogueId: savedDialogue._id,
        messages: []
      })
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

// Create a message used for group messaging as well.
router.post('/create_message', authenticateToken, async (req, res) => {
  if (!authorizeClient(req.body.sender, req.headers['authorization'])) return res.sendStatus(401)
  const message = new Message({
    _id: mongoose.Types.ObjectId(),
    body: req.body.body,
    type: req.body.type,
    sender: req.body.sender
  });
  message
    .save()
    .then((result) => {
      res.status(200).json({
        message: "Created a message successfully",
        createdMessage: {
          _id: result._id,
          body: result.body,
          type: result.type,
          sender: result.sender
        }
      })
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
})

module.exports = router