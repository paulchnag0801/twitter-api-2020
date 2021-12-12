if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
// const jwt = require('jsonwebtoken')
const cors = require('cors')
const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 80
const passport = require('./config/passport')
const userController = require('./controllers/userController')
const chatController = require('./controllers/chatController')

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:3000', 'https://beginneraboutlife116.github.io/tweet-front-2021/#/signin'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowEI03: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
})

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())

httpServer.listen(port, () =>
  console.log(`SimpleTwitter app listening on port ${port}!`)
)

const loginUsers = []

io.on('connection', (socket) => {
  socket.on('USER_ONLINE', async function (data) {
    // save user id
    const userExist = loginUsers.find((user) => {
      return user.id === data.user.id
    })
    if (!userExist) {
      loginUsers.push(data.user)
    }
    // get user detail
    const userList = await Promise.all(
      loginUsers.map((user) => {
        return userController.getUserProfile(user.id)
      })
    )
    // broadcast list back
    if (!userExist) {
      io.emit('ONLINE_LIST_UPDATE', {
        userList,
        user: { name: data.user.name, status: 'on' }
      })
    }
  })
  socket.on('USER_OFFLINE', function (data) {
    // save user id
    const findCurrentUser = loginUsers.findIndex((user) => user.id === data.id)
    if (findCurrentUser !== -1) {
      loginUsers.splice(findCurrentUser, 1)
    }
    // broadcast list back
    io.emit('ONLINE_LIST_UPDATE', {
      userList: loginUsers,
      user: { name: data.name, id: data.id, status: 'off' }
    })
  })
  socket.on('MESSAGE', async function (data) {
    // save it to db
    await chatController.saveChat(data)
    // broadcast back
    io.emit('MESSAGE_UPDATE', { ...data })
  })
  socket.on('disconnect', (reason) => {
    console.log('UserDisconnect', reason)
  })
})

io.on('connect_error', (err) => {
  console.log('connection error', err)
})

require('./routes')(app, passport)
module.exports = app
