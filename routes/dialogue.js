const express = require('express')
const router = express.Router()

const Dialogue = require('../models/Dialogue')
const { Message } = require('../models/Dialogue')
const User = require("../models/User")

const { authenticateToken, authorizeClient } = require('../AuthMiddleware')
const { mongoose } = require('mongoose')

router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log(req.query.currentUserId)
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const result = await User.findById(req.query.currentUserId, ['username', 'dialogues'])
    //.populate('dialogues', ['_id', 'participants', 'messages'])
    .populate({ 
      path: 'dialogues',
      populate: {
        path: 'participants',
        model: 'User',
        select: ['_id', 'username', 'status']
      } 
    })   
    .exec()

    console.log(result)  //.dialogues[0].participants
    return res.status(200).json(result)
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

router.get('/get_messages', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    //res.locals.userId

    if (req.query.dialogueId) {
      const dialogue = await Dialogue.findById(req.query.dialogueId)
      .populate('messages.sender', ['username'/* , 'email' */])
      .populate('participants', ['username'])
      .exec()
      
      if (dialogue != null) {
        return res.status(200).json({
          dialogueId: dialogue._id,
          messages: dialogue.messages
        })
      } else {
        const newDialogue = await createDialogue(req.query.companionUserId, req.query.currentUserId)
        if (newDialogue != null) {
          return res.status(200).json(newDialogue)
        } else {
          return res.sendStatus(500)
        }
      }

    } else {
      console.log('Search dialogue by user ids')
      const checkIfDialogueExists = await Dialogue.findOne({
        "participants": { $all: [req.query.companionUserId, req.query.currentUserId] }
      })
      .populate('messages.sender', ['username'/* , 'email' */])
      .populate('participants', ['username'])
      if (checkIfDialogueExists != null) {
        console.log('find')
        return res.status(200).json({
          dialogueId: checkIfDialogueExists._id,
          messages: checkIfDialogueExists.messages
        })
      } else {
        console.log('create new')
        const newDialogue = await createDialogue(req.query.companionUserId, req.query.currentUserId)
        if (newDialogue != null) {
          return res.status(200).json(newDialogue)
        } else {
          return res.sendStatus(500)
        }
        
      }
    }

  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

async function createDialogue(userId1, userId2) {
  try {
    const newDialogue = new Dialogue()
    newDialogue.participants.push(userId1)
    newDialogue.participants.push(userId2)
    const savedDialogue = await newDialogue.save()
    return {
      dialogueId: savedDialogue._id,
      messages: []
    }
  } catch(error) {
    console.log(error)
    return null
  }
}




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