const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')
const Message = require('../models/Message')
const User = require('../models/User')

router.get('/', (req, res) => {
  try {    
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    let currentUserId = ''
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.sendStatus(403)
      } else {
        currentUserId = decoded.id

        if (req.query.currentUserId != currentUserId) return res.sendStatus(401)


        const user = await User.findOne({id: req.query.companionUserId})
        if (user == null || req.query.companionUserId === user._id) return res.sendStatus(422)
        //console.log("Find user: " + req.params.username + user)
        //const messages = await Message.find({ sender: { $in: [ user.id, req.user.id ]}} , {recipient: { $in: [ user.id, req.user.id ]}}).exec()       
        const messages = await Message.find({ 
          sender: { $in: [ req.query.companionUserId, req.query.currentUserId ] }, 
          recipient: { $in: [ req.query.companionUserId, req.query.currentUserId ] } 
        }).populate('sender')
        //console.log('Messages: '+ messages)
        return res.json({
          companion: user,
          messages: messages
        }).status(200) 
      }      
    })    
  } catch (err) {
    console.log(err)    
    return res.sendStatus(500)
  }
})

module.exports = router