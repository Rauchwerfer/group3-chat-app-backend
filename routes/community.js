const express = require('express')
const router = express.Router()

const User = require("../models/User")

const { authenticateToken, authorizeClient} = require('../AuthMiddware') // Authentication and Authorization methods


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

module.exports = router