import { createHash } from 'crypto';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';

type JackpotUpdateMessage = {
  type: 'jackpot:update';
  characterId: number;
  currentPool: number;
  timeRemaining: number;
  lastPetAt: string | null;
};

const WS_PATH = '/ws/jackpot';
const clients = new Set<Duplex>();

export function handleJackpotWebSocketUpgrade(req: IncomingMessage, socket: Duplex) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== WS_PATH) {
    return false;
  }

  const upgradeHeader = req.headers.upgrade;
  const wsKey = req.headers['sec-websocket-key'];

  if (
    typeof upgradeHeader !== 'string' ||
    upgradeHeader.toLowerCase() !== 'websocket' ||
    typeof wsKey !== 'string'
  ) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return true;
  }

  const acceptKey = createWebSocketAcceptKey(wsKey);
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n',
  ];

  socket.write(responseHeaders.join('\r\n'));
  if ('setNoDelay' in socket && typeof socket.setNoDelay === 'function') {
    socket.setNoDelay(true);
  }
  clients.add(socket);

  socket.on('data', (buffer) => {
    const opcode = buffer[0] & 0x0f;
    if (opcode === 0x8) {
      // Client close frame
      clients.delete(socket);
      socket.end();
    }
  });

  const onDisconnect = () => {
    clients.delete(socket);
  };
  socket.on('close', onDisconnect);
  socket.on('end', onDisconnect);
  socket.on('error', onDisconnect);

  return true;
}

export function broadcastJackpotUpdate(message: Omit<JackpotUpdateMessage, 'type'>) {
  const payload = JSON.stringify({
    type: 'jackpot:update',
    ...message,
  } satisfies JackpotUpdateMessage);
  const frame = encodeWebSocketTextFrame(payload);

  for (const client of clients) {
    if (client.destroyed) {
      clients.delete(client);
      continue;
    }
    client.write(frame);
  }
}

export function closeJackpotWebSockets() {
  for (const client of clients) {
    if (!client.destroyed) {
      client.end();
    }
  }
  clients.clear();
}

function createWebSocketAcceptKey(key: string) {
  return createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');
}

function encodeWebSocketTextFrame(text: string) {
  const payload = Buffer.from(text);
  const payloadLength = payload.length;

  let header: Buffer;
  if (payloadLength < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text frame
    header[1] = payloadLength;
  } else if (payloadLength < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payloadLength), 2);
  }

  return Buffer.concat([header, payload]);
}
