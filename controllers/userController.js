const bcrypt = require('bcryptjs')
const { User, Like, Tweet, Reply } = require('../models')
const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const helpers = require('../_helpers')

// JWT
const jwt = require('jsonwebtoken')

const userController = {
  // signIn & signUp
  signIn: (req, res) => {
    const { account, password } = req.body
    if (!account || !password) {
      return res.json({
        status: 'error',
        message: "required fields didn't exist"
      })
    }

    User.findOne({ where: { account } }).then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ status: 'error', message: '帳號或密碼錯誤' })
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return res
          .status(401)
          .json({ status: 'error', message: '帳號或密碼錯誤' })
      }
      // 簽發 token
      const payload = { id: user.id }
      const token = jwt.sign(payload, process.env.JWT_SECRET)
      return res.json({
        status: 'success',
        message: 'ok',
        token: token,
        user: {
          id: user.id,
          account: user.account,
          name: user.name,
          email: user.email,
          introduction: user.introduction,
          avatar: user.avatar,
          cover: user.cover,
          role: user.role
        }
      })
    })
  },

  signUp: async (req, res) => {
    try {
      // confirm password
      if (req.body.checkPassword !== req.body.password) {
        return res
          .status(401)
          .json({ status: 'error', message: '兩次密碼不相同' })
      } else {
        // confirm unique user
        const email = await User.findOne({ where: { email: req.body.email } })
        const account = await User.findOne({
          where: { account: req.body.account }
        })
        if (account) {
          return res.status(401).json({
            status: 'error',
            message: 'account已重複註冊！'
          })
        }
        if (email) {
          return res.status(401).json({
            status: 'error',
            message: 'email已重複註冊！'
          })
        } else {
          const user = await User.create({
            account: req.body.account,
            name: req.body.name,
            email: req.body.email,
            role: 'user',
            password: bcrypt.hashSync(
              req.body.password,
              bcrypt.genSaltSync(10)
            )
          })
          return res.status(200).json({
            status: 'success',
            message: '成功註冊帳號！',
            user: { id: user.id, email: user.email, account: user.account }
          })
        }
      }
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ status: 'error', message: 'service error!' })
    }
  },

  // user
  getUser: async (req, res) => {
    try {
      const user = (
        await User.findByPk(req.params.id, {
          attributes: [
            'id',
            'account',
            'name',
            'email',
            'avatar',
            'cover',
            'introduction',
            'role'
          ],
          include: [
            { model: Tweet },
            { model: User, as: 'Followings' },
            { model: User, as: 'Followers' }
          ]
        })
      ).toJSON()
      const result = {
        id: user.id,
        account: user.account,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        cover: user.cover,
        introduction: user.introduction,
        role: user.role,
        tweetCounts: user.Tweets ? user.Tweets.length : 0,
        followship: {
          followerCounts: user.Followers ? user.Followers.length : 0,
          followingCounts: user.Followings ? user.Followings.length : 0
        },
        isFollowing: helpers
          .getUser(req)
          .Followings.some((user) => user.id === Number(req.params.id))
      }
      return res.status(200).json(result)
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ status: 'error', message: 'service error!' })
    }
  },

  putUser: async (req, res) => {
    const { password, account, email } = req.body
    try {
      // 只有自己能編輯自己的資料
      // 防止使用網址修改id切換使用者去修改別人的Profile
      if (helpers.getUser(req).id !== Number(req.params.id)) {
        return res.status(401).json({
          status: 'error',
          message: '無法變更其他使用者的Profile'
        })
      }
      const { files } = req
      if (files) {
        imgur.setClientId(IMGUR_CLIENT_ID)
        if (files.avatar) {
          // 如果有上傳avatar，直接上傳到imgur
          const avatar = await imgur.uploadFile(files.avatar[0].path)
          req.body.avatar = avatar.link
        }
        if (files.cover) {
          // 如果有上傳cover，直接上傳到imgur
          const cover = await imgur.uploadFile(files.cover[0].path)
          req.body.cover = cover.link
        }
      }
      const isAccountExit = await User.findOne({
        where: { account },
        raw: true,
        nest: true
      })
      if (isAccountExit && isAccountExit.id !== helpers.getUser(req).id) {
        return res.status(401).json({
          status: 'error',
          message: 'account已重複註冊！'
        })
      }
      const isEmailExit = await User.findOne({
        where: { email },
        raw: true,
        nest: true
      })
      if (isEmailExit && isEmailExit.id !== helpers.getUser(req).id) {
        return res.status(401).json({
          status: 'error',
          message: 'email已重複註冊！'
        })
      }
      if (password) {
        await User.update(
          {
            ...req.body,
            password: bcrypt.hashSync(
              req.body.password,
              bcrypt.genSaltSync(10)
            )
          },
          { where: { id: helpers.getUser(req).id } }
        )
        return res.status(200).json({
          status: 'success',
          message: '已成功更新！'
        })
      } else {
        await User.update(
          { ...req.body },
          { where: { id: helpers.getUser(req).id } }
        )
        return res.status(200).json({
          status: 'success',
          message: '已成功更新！'
        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({ status: 'error', message: 'service error!' })
    }
  },
  getUsersTweets: async (req, res) => {
    try {
      const userTweets = await Tweet.findAll({
        where: { UserId: req.params.id },
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
          { model: Like },
          { model: Reply }
        ],
        order: [['createdAt', 'DESC']]
      })

      const results = userTweets.map((userTweets) => ({
        id: userTweets.dataValues.id,
        description: userTweets.dataValues.description,
        createdAt: userTweets.dataValues.createdAt,
        User: userTweets.dataValues.User,
        likeCounts: userTweets.dataValues.Likes.length,
        replyCounts: userTweets.dataValues.Replies.length,
        isLike: helpers.getUser(req).Likes
          ? helpers
              .getUser(req)
              .Likes.some((like) => like.TweetId === userTweets.dataValues.id)
          : false
      }))
      return res.status(200).json(results)
    } catch (error) {
      console.log(error)
      return res.status(500).json({ status: 'error', message: 'Server error' })
    }
  },
  getUsersRepliesTweets: async (req, res) => {
    try {
      const usersReplies = await Reply.findAll({
        where: { UserId: req.params.id },
        raw: true,
        nest: true,
        attributes: ['id', 'comment', 'createdAt'],
        include: [
          { model: User, attributes: ['id', 'name', 'avatar'] },
          {
            model: Tweet,
            attributes: ['id'],
            include: [{ model: User, attributes: ['id', 'account'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      })
      return res.status(200).json(usersReplies)
    } catch (error) {
      console.log(error)
      return res.status(500).json({ status: 'error', message: 'Server error' })
    }
  },
  getUserLikes: async (req, res) => {
    try {
      const UserLikes = await Like.findAll({
        where: { UserId: req.params.id },
        include: [
          {
            model: Tweet,
            include: [
              { model: Reply },
              { model: Like },
              { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      })

      const results = UserLikes.map((UserLikes) => {
        const Tweet = {
          id: UserLikes.dataValues.Tweet.id,
          description: UserLikes.dataValues.Tweet.description,
          createdAt: UserLikes.dataValues.Tweet.createdAt,
          replyCounts: UserLikes.dataValues.Tweet.Replies.length,
          likeCounts: UserLikes.dataValues.Tweet.Likes.length,
          User: UserLikes.dataValues.Tweet.User
        }
        const result = {
          id: UserLikes.dataValues.id,
          TweetId: UserLikes.dataValues.TweetId,
          Tweet
        }
        return result
      })
      return res.status(200).json(results)
    } catch (error) {
      console.log(error)
      return res.status(500).json({ status: 'error', message: 'Server error' })
    }
  },
  getUsersFollowings: async (req, res) => {
    try {
      const user = (
        await User.findByPk(req.params.id, {
          include: [
            {
              model: User,
              as: 'Followings'
            }
          ]
        })
      ).toJSON()

      const results = user.Followings.map((results) => ({
        followingId: results.id,
        account: results.account,
        name: results.name,
        avatar: results.avatar,
        introduction: results.introduction,
        isFollowing: helpers
          .getUser(req)
          .Followings.some((user) => user.id === results.id)
      }))
      results.sort((a, z) => {
        return z.isFollowing - a.isFollowing
      })
      // move myself to the top
      const findMyself = results.findIndex(
        (data) => data.followingId === helpers.getUser(req).id
      )
      if (findMyself !== -1) {
        const myself = results[findMyself]
        results.splice(findMyself, 1)
        results.unshift(myself)
      }

      return res.status(200).json(results)
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ status: 'error', message: 'service error!' })
    }
  },

  getUserFollowers: async (req, res) => {
    try {
      const followers = (
        await User.findByPk(req.params.id, {
          include: [
            {
              model: User,
              as: 'Followers',
              attributes: ['id', 'name', 'account', 'introduction', 'avatar']
            }
          ]
        })
      ).toJSON()

      const results = followers.Followers.map((data) => {
        const result = {
          followerId: data.id,
          name: data.name,
          account: data.account,
          introduction: data.introduction,
          avatar: data.avatar,
          isFollowing: helpers
            .getUser(req)
            .Followings.some((user) => user.id === data.id)
        }
        return result
      })

      // move isFollowing = true to the top
      results.sort((a, z) => z.isFollowing - a.isFollowing)

      // move myself to the top
      const findMyself = results.findIndex(
        (data) => data.followerId === helpers.getUser(req).id
      )
      if (findMyself !== -1) {
        const myself = results[findMyself]
        results.splice(findMyself, 1)
        results.unshift(myself)
      }
      return res.status(200).json(results)
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ status: 'error', message: 'service error!' })
    }
  },
  getUserProfile: async (userId) => {
    try {
      const user = await User.findOne({
        raw: true,
        nest: true,
        where: { id: userId },
        attributes: ['id', 'name', 'account', 'avatar']
      })
      return user
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = userController
