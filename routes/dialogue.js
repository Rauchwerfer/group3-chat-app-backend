const express = require('express')
const router = express.Router()

const Dialogue = require('../models/Dialogue')

const { authenticateToken, authorizeClient} = require('../AuthMiddware')

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    //res.locals.userId

    const checkIfDialogueExists = await Dialogue.findOne({
      participants: { $all: [req.query.companionUserId, req.query.currentUserId]} 
    }).populate('messages.sender', ['username'/* , 'email' */])
    if (checkIfDialogueExists != null) {
      return res.status(200).json({ 
        dialogueId: checkIfDialogueExists._id,
        messages: checkIfDialogueExists.messages
      })
    } else {
      const newDialogue = new Dialogue({
        participants: [ req.query.companionUserId, req.query.currentUserId ]
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

module.exports = router