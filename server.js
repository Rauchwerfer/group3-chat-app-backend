if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require("express")
const app = express()

const { createServer } = require("http")
const httpServer = createServer(app)


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


httpServer.listen(process.env.PORT || 5000, ()=> console.log("Server started"));