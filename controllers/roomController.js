const { Chat } = require('../models')
const { Op } = require('sequelize')

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
    const { SenderId, ReceiverId } = data
    const chat = await Chat.findOne({
      SenderId: {
        [Op.in]: [SenderId, ReceiverId]
      },
      ReceiverId: {
        [Op.in]: [SenderId, ReceiverId]
      }
    })
    return chat.room
  }
}
module.exports = roomController
