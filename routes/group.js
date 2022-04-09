const express = require('express')
const router = express.Router()

const { Group, Message } = require('../models/Group')

const { authenticateToken, authorizeClient } = require('../AuthMiddleware')
const { default: mongoose } = require('mongoose')
const res = require('express/lib/response')

// Get messages sent to a group
// (WE NEED TO ADD A CHECK WHICH CHECKS IF THE USER IS IN THE GROUP OR NOT!)
router.get('/get_messages/:groupId', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    Group.findOne({ _id: req.params.groupId })
      .populate('participants moderators creator', '_id username status image')
      .populate({ path: 'messages', populate: { path: 'sender', select: '_id username status image' } })
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

// Send a message to the group.
// Before this create a message on dialogue endpoint and then add it here via the messages id we will populate the messages when we get them 
// (WE NEED TO ADD A CHECK WHICH CHECKS IF THE USER IS IN THE GROUP OR NOT!)
router.post('/send_message', authenticateToken, async (req, res) => {

})

// Create a message used for group messaging as well.
router.post('/create_message/:groupId', authenticateToken, async (req, res) => {
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
        result
      })
      addMessageToGroup(result._id, req.params.groupId)
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
})

async function addMessageToGroup(message, params) {
  try {
    const result = await Group.findOneAndUpdate(
      {
        _id: params
      },
      {
        $push: {
          messages: message
        }
      }
    )
    //console.log(result)
  } catch (error) {
    console.log(error)
  }
}

// Add users to group only for the moderator? Maybe everyone should be able to add? (right now everyone can add)
router.post('/add_to_group', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.companionUserId, req.headers['authorization'])) return res.sendStatus(401)
    const group = await Group.findById(req.body.groupId);
    if (!group.participants.includes(req.body.companionUserId)) {
      await group.updateOne({ $push: { participants: req.body.companionUserId } });
      res.status(201).json({ success: "Participant was added" });
    } else {
      await group.updateOne({ $pull: { participants: req.body.companionUserId } });
      res.status(200).json({ success: "Participant was deleted" });
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

// Create a group with the creator as the creator and a moderator 
router.post('/create_group', authenticateToken, async (req, res) => {
  if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
  const group = new Group({
    _id: mongoose.Types.ObjectId(),
    title: req.body.title,
    image: req.body.image,
    participants: req.body.participants,
    creator: req.body.currentUserId,
    moderators: req.body.moderators,
  });
  group
    .save()
    .then((result) => {
      res.status(200).json({
        message: "Created group successfully",
        createdGroup: {
          _id: result._id,
          title: result.title,
          creator: result.creator
        }
      })
      addUserToGroup(req.body.currentUserId, result._id)
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
})

async function addUserToGroup(userId, groupId) {
  try {
    const result = await User.findOneAndUpdate(
      {
        _id: userId
      },
      {
        $push: {
          groups: groupId
        }
      }
    )
    console.log(result)
  } catch (error) {
    console.log(error)
  }
}



module.exports = router