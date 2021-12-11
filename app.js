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
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowEI03: true
  }
})

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())

httpServer.listen(port, () =>
  console.log(`SimpleTwitter app listening on port ${port}!`)
)

const loginUsers = []

// io.use(function (socket, next) {
//   console.log("-------", socket.data);
//   if (socket.handshake.query && socket.handshake.query.token) {
//     jwt.verify(socket.handshake.query.token, "paul", function (err, decoded) {
//       if (err) return next(new Error("Authentication error"));
//       socket.decoded = decoded;
//       console.log("verify");
//       next();
//     });
//   } else {
//     next(new Error("Authentication error"));
//   }
// }).
io.on('connection', (socket) => {
  console.log('>>>>connection to server now', socket.id)
  socket.on('USER_ONLINE', async function (data) {
    console.log('user online', data)
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
    console.log('send back user list, online', userList)
    io.emit('ONLINE_LIST_UPDATE', {
      userList,
      user: { name: data.user.name, status: 'on' }
    })
  })
  socket.on('USER_OFFLINE', function (data) {
    console.log('user offline', data)
    // save user id
    const findCurrentUser = loginUsers.findIndex((user) => user.id === data.id)
    if (findCurrentUser !== -1) {
      loginUsers.splice(findCurrentUser, 1)
    }
    // broadcast list back
    console.log('send back user list, offline', loginUsers)
    io.emit('ONLINE_LIST_UPDATE', {
      userList: loginUsers,
      user: { name: data.name, id: data.id, status: 'off' }
    })
  })
  socket.on('MESSAGE', async function (data) {
    // data = { user: id, message: '', timestamp:}
    console.log('--------', data)
    // save it to db
    await chatController.saveChat(data)
    // broadcast back
    io.emit('MESSAGE_UPDATE', { ...data })
  })
  socket.on('disconnect', (reason) => {
    console.log('user disconnect', reason)
    // ...
  })
})

io.on('connect_error', (err) => {
  console.log('connection error', err)
})

require('./routes')(app, passport)
module.exports = app

// socket.emit("connection", "I am online");
