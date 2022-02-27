const { Chat, User } = require('../models')
const { Op, Sequelize } = require('sequelize')

const roomController = {
  creatRoom: (data) => {
    // const { user1, user2 } = data
    // const RoomInstance = await Room.create({
    //   user1Id: user1,
    //   user2Id: user2
    // })
    // return RoomInstance.toJSON()
    const roomId = Math.floor((new Date()).getTime() / 1000).toString()
    return roomId
  },
  findRoom: async (data) => {
    const chat = await Chat.findOne({
      where: {
        SenderId: {
          [Op.in]: data
        },
        ReceiverId: {
          [Op.in]: data
        }
      }
    })
    return chat ? chat.toJSON().room : null
  },
  saveChat: async (data) => {
    try {
      await Chat.create(data)
    } catch (error) {
      console.log(error)
    }
  },
  getAllRooms: async (data) => {
    try {
      // get all room that sender id or receiver id is data
      // make it unnique
      const chats = await Chat.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('room')), 'room'], 'SenderId', 'ReceiverId'],
        where: {
          [Op.or]: [
            { SenderId: data },
            { ReceiverId: data }
          ]
        }
      })
      const result = {}
      chats.forEach(chat => {
        const { room, SenderId, ReceiverId } = chat.dataValues
        result[room] = [SenderId, ReceiverId]
      })
      return result
    } catch (error) {
      console.log(error)
    }
  },

  getRoomSnapshot: async (req, res) => {
    try {
      const searchDetail = Object.entries(req.body)
      const snapshotList = await Promise.all(
        searchDetail.map(item => {
          return roomController.getSingleSnapshot(item)
        })
      )
      return res.status(200).json(snapshotList)
    } catch (error) {
      console.log(error)
    }
  },

  getSingleSnapshot: async (data) => {
    const [room, user] = data
    const chatDetail = await Chat.findOne({
      where: {
        room
      },
      order: [['createdAt', 'DESC']],
      limit: 1
    })

    const userDetail = await User.findOne({
      where: {
        id: user
      }
    })

    const result = {
      User: {
        avatar: userDetail?.dataValues.avatar,
        account: userDetail?.dataValues.account,
        name: userDetail?.dataValues.name,
        id: userDetail?.dataValues.id
      },
      ...chatDetail.toJSON()
    }
    return result
  },

  getRoomChatHistory: async (req, res) => {
    const room = req.params.id
    const histories = await Chat.findAll({
      raw: true,
      nest: true,
      where: { room }
    })
    return res.status(200).json({ status: 'success', message: histories })
  },

  markIsRead: async (req, res) => {
    // req.body
    Promise.all(async (data) => {
      await Chat.update({ ...data, isRead: 1 }, { where: { id: data.id } })
    })
  }
}
module.exports = roomController
