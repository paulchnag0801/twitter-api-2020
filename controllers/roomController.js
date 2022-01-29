const { Chat, User } = require('../models')
const { Op, Sequelize } = require('sequelize')
const { database } = require('faker/locale/az')

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
  getRoomSnapshot: async (data) => {
    try {
      const searchDetail = Object.entries(data)
      const snapshotList = await Promise.all(
        searchDetail.map(item => {
          return roomController.getSingleSnapshot(item)
        })
      )
      return snapshotList
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
  }
}
module.exports = roomController
