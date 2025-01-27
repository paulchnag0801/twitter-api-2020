const userController = require('../controllers/userController')
const tweetController = require('../controllers/tweetController')
const followController = require('../controllers/followController')
const adminController = require('../controllers/adminController')
const likeController = require('../controllers/likeController')
const replyController = require('../controllers/replyController')
const chatController = require('../controllers/chatController')
const passport = require('../config/passport')
const helpers = require('../_helpers')
const multer = require('multer')
const roomController = require('../controllers/roomController')
const upload = multer({ dest: 'temp/' })

// use helpers.getUser(req) to replace req.user
// 驗前台是user身分
const authenticatedUser = (req, res, next) => {
  if (helpers.getUser(req).role === 'admin') {
    return res.status(401).json({ status: 'error', message: '帳號不存在！' })
  }
  return next()
}

// 驗後台身分
const authenticatedAdmin = (req, res, next) => {
  if (helpers.getUser(req).role === 'user') {
    return res.status(401).json({ status: 'error', message: '帳號不存在！' })
  }
  return next()
}

// 登入token驗證
const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user, info) => {
    if (error) {
      return next(error)
    }
    if (!user) {
      return res.status(401).json({ status: 'error', message: '帳號不存在！' })
    }
    req.user = user
    return next()
  })(req, res, next)
}

module.exports = (app) => {
  //  signin & signup
  app.post('/api/users', userController.signUp)
  app.post('/api/users/signin', userController.signIn)

  // users routes
  app.get(
    '/api/users/:id',
    authenticated,
    authenticatedUser,
    userController.getUser
  )

  app.put(
    '/api/users/:id',
    authenticated,
    authenticatedUser,
    upload.fields([
      { name: 'avatar', maxCount: 1 },
      { name: 'cover', maxCount: 1 }
    ]),
    userController.putUser
  )

  app.get(
    '/api/users/:id/tweets',
    authenticated,
    authenticatedUser,
    userController.getUsersTweets
  )

  app.get(
    '/api/users/:id/replied_tweets',
    authenticated,
    authenticatedUser,
    userController.getUsersRepliesTweets
  )
  app.get(
    '/api/users/:id/followings',
    authenticated,
    authenticatedUser,
    userController.getUsersFollowings
  )

  app.get(
    '/api/users/:id/followers',
    authenticated,
    authenticatedUser,
    userController.getUserFollowers
  )

  // replies
  app.get(
    '/api/tweets/:tweet_id/replies',
    authenticated,
    authenticatedUser,
    replyController.getTweetReply
  )
  app.post(
    '/api/tweets/:tweet_id/replies',
    authenticated,
    authenticatedUser,
    replyController.postReply
  )

  // tweets

  app.get('/api/tweets', authenticated, tweetController.getTweets)
  app.get(
    '/api/tweets/:tweet_id',
    authenticated,
    authenticatedUser,
    tweetController.getTweet
  )
  app.post(
    '/api/tweets',
    authenticated,
    authenticatedUser,
    tweetController.postTweet
  )

  // followship
  app.get(
    '/api/followships/top',
    authenticated,
    authenticatedUser,
    followController.getTopUser
  )
  app.post(
    '/api/followships',
    authenticated,
    authenticatedUser,
    followController.addFollowing
  )
  app.delete(
    '/api/followships/:followingId',
    authenticated,
    authenticatedUser,
    followController.deleteFollowing
  )

  // like
  app.post(
    '/api/tweets/:id/unlike',
    authenticated,
    authenticatedUser,
    likeController.postUnlike
  )
  app.post(
    '/api/tweets/:id/like',
    authenticated,
    authenticatedUser,
    likeController.likeTweet
  )
  app.get(
    '/api/users/:id/likes',
    authenticated,
    authenticatedUser,
    userController.getUserLikes
  )

  // admin
  app.get(
    '/api/admin/users',
    authenticated,
    authenticatedAdmin,
    adminController.getUsers
  )
  app.delete(
    '/api/admin/tweets/:id',
    authenticated,
    authenticatedAdmin,
    adminController.deleteTweet
  )

  // chat
  // app.get(
  //   '/api/chats',
  //   authenticated,
  //   authenticatedUser,
  //   chatController.getHistoryChats
  // )

  // room chat
  app.get('/api/rooms/:id', authenticated, authenticatedUser, roomController.getRoomChatHistory)

  app.post('/api/rooms/snapshot/:id', authenticated, authenticatedUser, roomController.getRoomSnapshot)

  app.post('/api/rooms/:roomId', authenticated, authenticatedUser, roomController.markIsRead)
}
