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
      console.log('>>>', data)
      await Chat.create(data)
    } catch (error) {
      console.log(error)
    }
  }
}
module.exports = roomController
