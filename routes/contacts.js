const express = require('express')
const router = express.Router()

const User = require("../models/User")

const { authenticateToken, authorizeClient } = require('../AuthMiddleware')

// Get contact list
router.get('/', authenticateToken, async (req, res) => {
  const user = await User.findById(res.locals.userId).populate('contacts', ['_id', 'username'])
  return res.status(200).json(user.contacts)
})

// Add user to Contacts or delete if it is already in contacts
router.post('/add_contact', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const user = await User.findById(req.body.currentUserId);
    if (!user.contacts.includes(req.body.companionUserId)) {
      await user.updateOne({ $push: { contacts: req.body.companionUserId } });
      res.status(201).json({ success: "Contact was added"});
    } else {
      await user.updateOne({ $pull: { contacts: req.body.companionUserId } });
      res.status(200).json({ success: "Contact was deleted"});
    }
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  } 
})


// Check if user is in contacts
router.get('/is_contact', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const user = await User.findById(req.query.currentUserId)
    const isContact = user.contacts.includes(req.query.companionUserId)
    res.status(200).json({ isContact: isContact })
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  } 
})

module.exports = router