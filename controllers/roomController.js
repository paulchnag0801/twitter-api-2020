const { Chat } = require('../models')
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
  }
}
module.exports = roomController
