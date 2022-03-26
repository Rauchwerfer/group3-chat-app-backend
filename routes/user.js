/* 
  User account routes:
  - edit (status, username)
  - delete account
*/


const express = require('express')
const router = express.Router()

const User = require("../models/User")

const { authenticateToken, authorizeClient } = require('../AuthMiddware')

router.post('/set_status', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const user = await User.findById(req.body.currentUserId);
    const savedUser = await user.updateOne({ $set: { status: req.body.newStatus } });
    return res.status(200).json({ newStatus: savedUser.status })
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  } 
})

router.post('/set_username', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const user = await User.findById(req.body.currentUserId);
    const result = await user.updateOne({ $set: { username: req.body.newUsername } });
    console.log(result)
    if (result.modifiedCount == 1) {
      return res.sendStatus(200)
    } else {
      return res.sendStatus(204)
    }    
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  } 
})

router.delete('/delete_account', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const result = await User.deleteOne({"_id": req.body.currentUserId})
    console.log(result)
    if (result.deletedCount == 1) {
      return res.sendStatus(200)
    } else {
      return res.sendStatus(204)
    }    
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  }   
})

module.exports = router