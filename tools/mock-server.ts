/**
 * Mock TCP Server — simulates an ESP device running WirelessSerial.
 *
 * Usage:
 *   npx ts-node tools/mock-server.ts
 *   # or
 *   node -e "require('./tools/mock-server.js')"
 *
 * Then connect from Serial Air app to your PC's IP on port 23.
 */

import net from 'net';

const PORT = 23;
let clientId = 0;

const server = net.createServer((socket) => {
  const id = ++clientId;
  console.log(`[Client ${id}] Connected from ${socket.remoteAddress}`);

  // Send initial boot messages
  socket.write('Boot complete\n');
  socket.write('WiFi connected\n');
  socket.write(`IP: 192.168.4.1\n`);
  socket.write(`WirelessSerial v1.0.0\n`);
  socket.write('---\n');

  // Send periodic sensor data
  const interval = setInterval(() => {
    const temp = (20 + Math.random() * 10).toFixed(1);
    const humidity = (40 + Math.random() * 30).toFixed(1);
    const heap = Math.floor(30000 + Math.random() * 5000);

    socket.write(`Temperature: ${temp}°C\n`);
    socket.write(`Humidity: ${humidity}%\n`);
    socket.write(`Heap: ${heap} bytes\n`);
    socket.write('---\n');
  }, 2000);

  // Handle incoming commands
  let buffer = '';
  socket.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        console.log(`[Client ${id}] Command: ${line.trim()}`);
        socket.write(`[Echo] ${line.trim()}\n`);
      }
    }
  });

  socket.on('close', () => {
    clearInterval(interval);
    console.log(`[Client ${id}] Disconnected`);
  });

  socket.on('error', (err) => {
    clearInterval(interval);
    console.log(`[Client ${id}] Error: ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log(`Mock ESP device running on port ${PORT}`);
  console.log('Connect from Serial Air app or: telnet localhost 23');
});
