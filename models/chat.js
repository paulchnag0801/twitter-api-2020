'use strict';
module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define(
    'Chat',
    {
      message: DataTypes.TEXT,
      SenderId: DataTypes.INTEGER,
      ReceiverId: DataTypes.INTEGER,
      room: DataTypes.STRING,
      isRead: DataTypes.BOOLEAN

    },
    {}
  )
  Chat.associate = function (models) {
    // associations can be defined here
  }
  return Chat
};
