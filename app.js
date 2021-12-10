if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cors = require('cors')
const { createServer } = require('http')
const { Server } = require('socket.io')
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {})
const port = process.env.PORT || 3000

const passport = require('./config/passport')

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(passport.initialize())

// sock-set-up
// connection event handler
io.on('connection', (socket) => {

})
// server.listen(8088)

httpServer.listen(port, () => console.log(`SimpleTwitter app listening on port ${port}!`)
)

require('./routes')(app, passport)
module.exports = app
