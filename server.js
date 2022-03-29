if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// Express App Implementation
const express = require("express")
const app = express()
const cors = require("cors")
app.use(
  cors({
    origin: "*"
  })
)
//

// Create Server for the App
const { createServer } = require("http")
const httpServer = createServer(app)

const { socketServer } = require('./socketServer')
// Add Socket Server to existing Server
socketServer(httpServer)
//

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

// End DB Init

// App routing implement
app.use(express.json())

// Routers
const authRouter = require('./routes/auth')
app.use('/auth', authRouter)
const communityRouter = require('./routes/community')
app.use('/community', communityRouter)
const dialogueRouter = require('./routes/dialogue')
app.use('/dialogue', dialogueRouter)
const contactsRouter = require('./routes/contacts')
app.use('/contacts', contactsRouter)
const userRouter = require('./routes/user')
app.use('/user', userRouter)
const groupRouter = require('./routes/group')
app.use('/group', groupRouter)

app.get('/', (req, res) => {
  res.status(200).send({ "Success": "Server is running!" })
})

app.get('*', (req, res) => {
  res.sendStatus(404);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, ()=> console.log("Server started at port " + PORT));