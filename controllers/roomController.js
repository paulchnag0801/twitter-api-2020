const { Room } = require('../models')

const roomController = {
  creatRoom: async (data) => {
    const { user1, user2 } = data
    const RoomInstance = await Room.create({
      user1Id: user1,
      user2Id: user2
    })
    return RoomInstance.toJSON()
  }
}
module.exports = roomController
