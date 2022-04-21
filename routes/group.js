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
router.get('/get_messages/:groupId', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.query.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const isParticipant = await Group.findById(req.params.groupId).select('participants').exec();
    if (!isParticipant.participants.includes(req.query.currentUserId)) return res.status(401).json({ permissions: 'You are not a participant of this group.' })
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

// Make sure you cannot delete the creator or other moderators
router.post('/add_to_group', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const isModerator = await Group.findById(req.body.groupId).select('moderators creator').exec();
    if (!isModerator.moderators.includes(req.body.currentUserId)) return res.status(401).json({ permissions: 'You do not have moderator status in this group.' })
    // Checks if the user is the creator if so he can delete moderators as well
    if (!(isModerator.creator.toHexString() === req.body.currentUserId)) {
      if (isModerator.moderators.includes(req.body.companionUserId)) return res.status(401).json({ permissions: 'You do not have the permission to remove another moderator.' })
    }
    const group = await Group.findById(req.body.groupId);
    if (!group.participants.includes(req.body.companionUserId)) {
      await group.updateOne({ $push: { participants: req.body.companionUserId } });
      await addUserToGroup(req.body.companionUserId, req.body.groupId);
      res.status(201).json({ success: "Participant was added" });
    } else {
      await group.updateOne({ $pull: { participants: req.body.companionUserId, moderators: req.body.companionUserId } });
      await removeUserFromGroup(req.body.companionUserId, req.body.groupId);
      res.status(200).json({ success: "Participant was deleted" });
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

router.post('/admin', authenticateToken, async (req, res) => {
  try {
    if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
    const isCreator = await Group.findById(req.body.groupId).select('creator').exec();
    if (!(isCreator.creator.toHexString() === req.body.currentUserId)) return res.status(401).json({ permissions: 'You do not have creator status in this group.' })
    if(isCreator.creator.toHexString() === req.body.companionUserId) return res.status(401).json({ permissions: 'You cannot remove creators permissions.'})
    const group = await Group.findById(req.body.groupId);
    if (!group.moderators.includes(req.body.companionUserId)) {
      await group.updateOne({ $push: { moderators: req.body.companionUserId } });
      await addUserToGroup(req.body.companionUserId, req.body.groupId);
      res.status(201).json({ success: "Participant was given admin permissions" });
    } else {
      await group.updateOne({ $pull: { moderators: req.body.companionUserId } });
      await removeUserFromGroup(req.body.companionUserId, req.body.groupId);
      res.status(200).json({ success: "Participants admin permissions were removed" });
    }
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  }
})

router.post('/remove_from_group', authenticateToken, async (req, res) => {
  if (!authorizeClient(req.body.currentUserId, req.headers['authorization'])) return res.sendStatus(401)
  const isModerator = await Group.findById(req.body.groupId).select('creator').exec();
  if (!(isModerator.creator.toHexString() === req.body.currentUserId)) return res.status(401).json({ permissions: 'You do not have creator status in this group.' })
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
    const isModerator = await Group.findById(req.body.currentGroupId).select('moderators').exec();
    if (!isModerator.moderators.includes(req.body.currentUserId)) return res.status(401).json({ permissions: 'You do not have moderator status in this group.' })
    const checkIfImageExists = await Group.findById(req.body.currentGroupId, 'image').exec()
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
  } catch (error) {
    console.log(error)
  }
}



module.exports = router