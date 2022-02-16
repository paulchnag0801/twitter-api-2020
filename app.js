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
const roomController = require('./controllers/roomController')

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:3000', 'https://carolebot.github.io'],
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
  console.log('connection Id: ', socket.id)
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
    io.emit('ONLINE_LIST_UPDATE', {
      userList,
      user: { name: data.user.name, status: 'on' }
    })

    // subscribe to all room
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

  socket.on('SUBSCRIBE_TO_ALL_ROOM', async function (data) {
    const roomDetail = await roomController.getAllRooms(data)
    Object.keys(roomDetail).forEach(room => {
      socket.join(room)
    })
    socket.emit('SUBSCRIBED_ROOM', roomDetail)
  })

  // change to api
  socket.on('GET_ROOM_SNAPSHOT', async function (data) {
    const snapshot = await roomController.getRoomSnapshot(data)
    socket.emit('ROOM_SNAPSHOT', snapshot)
  })

  socket.on('CREATE_ROOM', async function (data) {
    console.log('---', data)
    let room = await roomController.findRoom(data)
    if (!room) {
      room = roomController.creatRoom()
    }
    io.emit('ROOM_CREATED', {
      room,
      users: data
    })
  })

  socket.on('SUBSCRIBE_ROOM', async function (data) {
    console.log(`${socket.id} join ${data}`)
    socket.join(data)
  })

  // get this room history, UI provide sender and receiver
  // change to api
  socket.on('GET_ROOM_HISTORY', async function (data) {
    const roomId = '12345678'
    const histories = await roomController.getRoomChatHistory(roomId)
    io.emit('SEND_ROOM_HISTORY', histories)
  })

  socket.on('SEND_ROOM_MESSAGE', async function (data) {
    const saveMessage = { ...data, isRead: false }
    if (saveMessage.room) {
      await roomController.saveChat(saveMessage)
    }
    socket.to(data.room).emit('NEW_ROOM_MESSAGE', saveMessage)
  })

  // //get unread message
  // socket.on('GET_UNREAD_MESSAGE', function(data){

  // })

  // change to api
  socket.on('CHANGE_TO_READ', async function (data) {
    await roomController.markIsRead(data)
    // UI provide a list of message, backend change all to true
  })

  // get receiver, sender from front-end. Backend get the history record
  // // sender: weikai, receiver: paul. find  history record, get room Id

  //  {
  //    Sender: Paul
  //    Receiver: Weikai
  //    Message:
  //    RoomId:
  //    isRead:
  //  }

  // Weikai
  //  unReadMessage:[
  //    {
  //      Sender: Paul
  //      Receiver: Weikai
  //      Message:
  //      RoomId:
  //    }
  //  ]
})

io.on('connect_error', (err) => {
  console.log('connection error', err)
})

require('./routes')(app, passport)
module.exports = app
