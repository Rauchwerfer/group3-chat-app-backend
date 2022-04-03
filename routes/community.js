const express = require('express')
const router = express.Router()

const User = require("../models/User")

const { authenticateToken } = require('../AuthMiddleware') // Authentication and Authorization methods


// User search
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = User.find()
    if (req.query.usernameSearch != null && req.query.usernameSearch != '') {
      query = query.regex('username', new RegExp(req.query.usernameSearch, 'i'))
    }
    const users = await query.exec()
    res.json(users)
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  }  
})

//later for image fetching will be separate routes
router.get('/get_user/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, '_id username status image').populate('image').exec()
    if (user != null) {
      return res.status(200).json(user)
    } else {
      return res.sendStatus(404)
    }
  } catch(error) {
    console.log(error)
    return res.sendStatus(500)
  } 
})

module.exports = router