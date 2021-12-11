const { Chat, User } = require("../models");

const chatController = {
  saveChat: async (data) => {
    try {
      const { user, message, timeStamp } = data;
      console.log(">>>>>>>>>>>>>>>");
      await Chat.create({ UserId: user.id, message, createdAt: timeStamp });
    } catch (error) {
      console.log(error);
    }
  },
};

module.exports = chatController;
