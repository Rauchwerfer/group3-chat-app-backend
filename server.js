if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// Express App Implementation
const express = require("express")
const app = express()
const cors = require("cors")
app.use(
  cors({
    origin: process.env.FRONTEND_URL
  })
)
//

// Create Server for the App
const { createServer } = require("http")
const httpServer = createServer(app)

// Use existing server with Node App to create Websocket
const { Server } = require("socket.io")
const io = new Server(httpServer, { 
  cors: {
  origin: "*",
}})
// End

// DB Init
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: false
})
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

const User = require('./models/User')
const Message = require('./models/Message')
// End DB Init

// Additional objects here
const jwt = require('jsonwebtoken') // JWT library
const { authenticateToken, authorizeClient} = require('./AuthMiddware') // Authentication and Authorization methods

// App routing implement
app.use(express.json())

// Routers
const authRouter = require('./routes/auth')
app.use('/auth', authRouter)
const communityRouter = require('./routes/community')
app.use('/community', communityRouter)
const messagesRouter = require('./routes/messages')
app.use('/messages', messagesRouter)
const contactsRouter = require('./routes/contacts')
app.use('/contacts', contactsRouter)
const userRouter = require('./routes/user')
app.use('/user', userRouter)

app.get('/', (req, res) => {
  res.status(200).send({ "Success": "Server is running!" })
})

app.get('/profile', authenticateToken, (req, res) => {
  res.send(req.user) 
})

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
    console.log(`${socket.id} is AUTHORIZED`)
    next();
  } else {
    next(new Error(`${socket.id} is UNAUTHORIZED`))
  }
})
// End Authorize in socket.io

// Socket.io
async function getUserId(username) {
  const user = await User.findOne({username: username})
  return user.id
}

io.on("connection", async (socket) => {
  let socketUserId
  jwt.verify(socket.handshake.query.token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) return socketUserId = ''
    socketUserId = decoded.id
  })

  if (socketUserId == '') return 

  const socketUser = await User.findOne({ '_id': socketUserId }).exec()
  if (socketUser == null) return
  socket.join(socketUser.username)

  socket.on("private message", async (request) => {    
    try {
      console.log(`Recipient: ${request.recipient}, body: ${request.body}, sender: ${request.sender}`)      
      const message = new Message({
        body: request.body,
        sender: await getUserId(request.sender),
        recipient: await getUserId(request.recipient)
      })
      const newMessage = await message.save()
      socket.to(request.recipient).emit("private message", request.sender, request.recipient, request.body, newMessage._id, newMessage.createdAt)
      io.to(request.sender).emit("private message sended", request.sender, request.recipient, request.body, newMessage._id, newMessage.createdAt)
    } catch(err) {
      console.log(err)
    }
  })

  socket.on("disconnect", () => {
    console.log(`User with socket.id = '${socket.id}' disconnected`)
  })

})
// End Socket.io


httpServer.listen(process.env.PORT || 5000, ()=> console.log("Server started"));