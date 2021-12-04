
const userController = require('../controllers/userController')
const tweetController = require('../controllers/tweetController')
const followController = require('../controllers/followController')
const adminController = require('../controllers/adminController')
const passport = require('../config/passport')
const helpers = require('../_helpers')

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
  // JWT signin & signup
  app.post('/api/users', userController.signUp)
  app.post('/api/users/signin', userController.signIn)
  // users routes
  app.get(
    '/api/users/:id',
    authenticated,
    authenticatedUser,
    userController.getUser
  )

  // tweets
  app.get('/api/tweets', authenticated, authenticatedUser, tweetController.getTweets)
  app.get('/api/tweets/:tweet_id', authenticated, authenticatedUser, tweetController.getTweet)
  app.post('/api/tweets', authenticated, authenticatedUser, tweetController.postTweet)

  // followship
  app.get('/api/followships/top', authenticated, authenticatedUser, followController.getTopUser)

  // admin
  app.get('/api/admin/users', authenticated, authenticatedAdmin, adminController.getUsers)
}
