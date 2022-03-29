/* 
  User account routes:
  - edit (status, username)
  - delete account
*/


const express = require('express')
const router = express.Router()

const User = require("../models/User")

const { authenticateToken, authorizeClient } = require('../AuthMiddleware')

router.post('/set_status', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const user = await User.findById(req.body.currentUserId);
    const result = await user.updateOne({ $set: { status: req.body.newStatus } });
    if (result.modifiedCount == 1) {
      return res.status(200).json({ newStatus: req.body.newStatus })
    } else {
      return res.sendStatus(204)
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

router.post('/set_username', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const user = await User.findById(req.body.currentUserId)
    const result = await user.updateOne({ $set: { username: req.body.newUsername } })
    if (result.modifiedCount == 1) {
      return res.status(200).json({ newUsername: req.body.newUsername })
    } else {
      return res.sendStatus(204)
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

router.delete('/delete_account', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const result = await User.deleteOne({ "_id": req.body.currentUserId })
    console.log(result)
    if (result.deletedCount == 1) {
      return res.sendStatus(200)
    } else {
      return res.sendStatus(204)
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

// Add user connections to groups so we can get the group information (MAY BE CHANGED LATER SINCE I DONT THINK ITS A GOOD IMPLEMETION? BUT I COULDNT THINK OF A ANOTHER WAY TO DO IT)
router.post('/add_group', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const user = await User.findById(req.body.currentUserId);
    if (!user.groups.includes(req.body.group)) {
      await user.updateOne({ $push: { groups: req.body.group } });
      res.status(201).json({ success: "Connection to group added" });
    } else {
      await user.updateOne({ $pull: { groups: req.body.group } });
      res.status(200).json({ success: "Connection to group deleted" });
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

// Get user data for groups and contacts
router.get('/get_user/:currentUserId', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.params.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    User.findOne({ _id: req.params.currentUserId })
      .select('_id username email status image')
      .populate('contacts', '_id username status image')
      .populate('groups', '_id title image')
      .exec()
      .then(result => {
        res.status(200).json(result)
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

module.exports = router