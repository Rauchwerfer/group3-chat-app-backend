const User = require('./models/User')
const jwt = require('jsonwebtoken')
const Dialogue = require('./models/Dialogue')

const socketServer = (httpServer) => {

  const { Server } = require("socket.io")
  const io = new Server(httpServer, { 
    cors: {
    origin: "*",
  }})
  
  // Authorize in socket.io
  io.use((socket, next) => {
    let isAuthoized = false
    jwt.verify(socket.handshake.query.token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) 
      isAuthoized = false
      else 
      isAuthoized = true
    })
  
    if (isAuthoized) {
      next();
    } else {
      next(new Error(`${socket.id} is UNAUTHORIZED`))
    }
  })
  // End Authorize in socket.io
  
  // Socket.io
  io.on("connection", async (socket) => {
    let socketUserId
    jwt.verify(socket.handshake.query.token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) return socketUserId = ''
      socketUserId = decoded.id
    })
  
    if (socketUserId == '') return 
  
    const socketUser = await User.findOne({ '_id': socketUserId }).exec()
    if (socketUser == null) return
    socket.join(socketUser._id.toString())

    // Needs for testing
    /* const arr = Array.from(io.sockets.adapter.rooms)
    const filtered = arr.filter(room => !room[1].has(room[0]))
    const usersOnline = filtered.map(i => i[0]);
    console.log(usersOnline)
    console.log(`Socket.id ${socket.id} currentUserId is ${socketUser._id}`) */
  

    // Request: dialogue(dialogue._id) recipient(user._id), sender(user._id), body ('String'), type ('String', ...)
    socket.on("send-private-message", async (request) => {    
      try {
        //console.log(`Dialogue: ${request.dialogue}, recipient: ${request.recipient}, body: ${request.body}, sender: ${request.sender}, type: ${request.type}`)      
        const result = await Dialogue.findByIdAndUpdate(request.dialogue,
          { 
            $push: {
              "messages": {
                body: request.body, 
                type: request.type,
                sender: request.sender,
              }
            }
          }, { new: true }          
        )

        const sentMessage = result.messages[result.messages.length - 1]
        //console.log(result)

        const sender = await User.findById(request.sender).exec()

        const response = {
          senderId: request.sender,
          recipientId: request.recipient,
          body: request.body,
          type: request.type,
          messageCreatedAt: sentMessage.createdAt,
          senderUsername: sender.username,
          messageId: sentMessage._id
        }
        
        socket.to(request.recipient).emit("private-message", response)
        io.to(request.sender).emit("private-message-sended", response)
      } catch(err) {
        console.log(err)
      }
    })
  
    socket.on("disconnect", () => {
      console.log(`User with socket.id = '${socket.id}' disconnected`)
    })
  
  })
  // End Socket.io
}

module.exports = { socketServer }