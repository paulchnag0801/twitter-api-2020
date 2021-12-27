'use strict'
module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    user1Id: DataTypes.INTEGER,
    user2Id: DataTypes.INTEGER
  }, {})
  Room.associate = function (models) {
    // associations can be defined here
  }
  return Room
}
