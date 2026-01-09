// socketInstance.js
let ioInstance;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized. Call setIO(io) first.");
  }
  return ioInstance;
};