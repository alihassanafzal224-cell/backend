import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js";
import socketAuth from "../middleware/socketAuth.js";

export const initSocket = (io) => {
  const onlineUsers = new Map();
  
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(socket.id)
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
   console.log("onlineusers",onlineUsers)
    // Each user has a private room = userId
    socket.join(userId);

    io.emit("online-users", [...onlineUsers.keys()]);

    // Join a conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
    });

    // Send message
    socket.on("send-message", async ({ conversationId, sender, text }) => {
      
  const message = await Message.create({
  conversationId,
  sender,
  text
});

const populatedMessage = await message.populate("sender", "_id");

io.to(conversationId).emit("new-message", populatedMessage);

});


    socket.on("disconnect", () => {
      console.log("user logedout",userId)
      onlineUsers.delete(userId);
      console.log("onlineusers",onlineUsers)
      io.emit("online-users", [...onlineUsers.keys()]);
    });
  });
};
