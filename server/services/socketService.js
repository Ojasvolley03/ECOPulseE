let ioInstance = null;

export function initSocketIO(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 WebSockets: Client connected (${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`🔌 WebSockets: Client disconnected (${socket.id})`);
    });
  });
}

export function getSocketIO() {
  return ioInstance;
}
