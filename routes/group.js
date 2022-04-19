const express = require('express')
const router = express.Router()

const { Group, Message } = require('../models/Group')

const User = require('../models/User')

const { authenticateToken, authorizeClient } = require('../AuthMiddleware')
const { default: mongoose } = require('mongoose')
const Image = require('../models/Image')

router.get('/get_group_data/:groupId', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    Group.findOne({ _id: req.params.groupId })
      .select('createdAt creator moderators participants title updatedAt image')
      .populate('participants moderators creator', '_id username status image')
      .populate('image')
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
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const group = await Group.findById(req.body.groupId);
    if (!group.participants.includes(req.body.companionUserId)) {
      await group.updateOne({ $push: { participants: req.body.companionUserId } });
      await addUserToGroup(req.body.companionUserId, req.body.groupId);
      res.status(201).json({ success: "Participant was added" });
    } else {
      await group.updateOne({ $pull: { participants: req.body.companionUserId } });
      await removeUserFromGroup(req.body.companionUserId, req.body.groupId);
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
      // This goes through all the participants and adds them to the group on the user side as well.
      req.body.participants.map(user => addUserToGroup(user, result._id))
      if (req.body.image !== null) {
        addImageToGroup(req, result._id);
      }
      res.status(200).json({
        message: "Created group successfully",
        createdGroup: {
          _id: result._id,
          title: result.title,
          creator: result.creator
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

router.post('/set_group_image', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)

    const checkIfImageExists = await Group.findById(req.body.currentUserId, 'image').exec()
    console.log(checkIfImageExists)
    if (checkIfImageExists != null) {
      const image = await Image.findById(checkIfImageExists.image).exec()
      if (image !== null) {
        image.imageType = req.body.imageType,
          image.imageBuffer = req.body.imageBuffer
        const savedImage = await image.save()
        return res.status(200).json({ success: "Image changed." })
      } else {
        return res.sendStatus(304)
      }
    } else {
      const result = await addImageToGroup(req)

      if (result && result.image) {
        return res.status(200).json({ success: "Image changed." })
      } else {
        return res.sendStatus(500)
      }
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

async function addImageToGroup(req, _id) {
  try {
    const groupId = req.body.currentGroupId || _id;
    const image = new Image({
      imageType: req.body.imageType,
      imageBuffer: req.body.imageBuffer
    })
    const savedImage = await image.save()
    const result = await Group.findByIdAndUpdate(groupId, {
      $set: {
        image: savedImage._id
      }
    }, {
      returnDocument: 'after'
    }).exec()

    return result;

  } catch (error) {
    console.log(error)
  }
}

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
  } catch (error) {
    console.log(error)
  }
}

async function removeUserFromGroup(userId, groupId) {
  try {
    console.log(userId)
    console.log(groupId)
    const result = await User.findOneAndUpdate(
      {
        _id: userId
      },
      {
        $pull: {
          groups: groupId
        }
      }
    )
    // console.log(result)
  } catch (error) {
    console.log(error)
  }
}



module.exports = router