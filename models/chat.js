'use strict';
module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define('Chat', {
    message: DataTypes.TEXT,
    UserId: DataTypes.INTEGER,
    room: DataTypes.STRING
  }, {});
  Chat.associate = function(models) {
    // associations can be defined here
  };
  return Chat;
};