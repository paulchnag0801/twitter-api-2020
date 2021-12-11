const { Chat, User } = require('../models')

const chatController = {
  saveChat: async (data) => {
    try {
      const { user, message, timeStamp } = data
      await Chat.create({ UserId: user.id, message, createdAt: timeStamp })
    } catch (error) {
      console.log(error)
    }
  },
  getHistoryChats: async (req, res) => {
    try {
      const chatLists = await Chat.findAll({
        include: [{ model: User }],
        order: [['createdAt', 'ASC']]
      })
      const result = chatLists.map((chat) => ({
        user: {
          id: chat.dataValues.User.id,
          name: chat.dataValues.User.name,
          avatar: chat.dataValues.User.avatar
        },
        message: chat.dataValues.message,
        timeStamp: chat.dataValues.createdAt
      }))
      res.status(200).json(result)
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ status: 'error', message: 'service error!' })
    }
  }
}

module.exports = chatController
