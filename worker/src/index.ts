import { DurableObject } from 'cloudflare:workers';

interface WebSocketMessage {
  type: 'message' | 'join' | 'leave' | 'history';
  data?: unknown;
  username?: string;
  content?: string;
  timestamp?: number;
}

interface ConnectedClient {
  webSocket: WebSocket;
  username: string;
  joinedAt: number;
}

interface Env {
  CHAT_ROOM: DurableObjectNamespace;
}

export class ChatRoom extends DurableObject<Env> {
  private sessions: Map<WebSocket, ConnectedClient> = new Map();
  private roomId: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.roomId = ctx.id.toString();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // Handle HTTP API requests
    if (url.pathname.endsWith('/messages') && request.method === 'GET') {
      return this.getMessages();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    if (!username) {
      return new Response('Username required', { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    this.ctx.acceptWebSocket(server);

    // Store client info
    const clientInfo: ConnectedClient = {
      webSocket: server,
      username,
      joinedAt: Date.now(),
    };
    this.sessions.set(server, clientInfo);

    // Send chat history to the new user
    await this.sendChatHistory(server);

    // Broadcast user joined message
    this.broadcast({
      type: 'join',
      username,
      timestamp: Date.now(),
    }, server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    try {
      const client = this.sessions.get(ws);
      if (!client) return;

      const parsedMessage: WebSocketMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'message':
          await this.handleNewMessage(client, parsedMessage.content || '');
          break;
        case 'history':
          await this.sendChatHistory(ws);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const client = this.sessions.get(ws);
    if (client) {
      // Broadcast user left message
      this.broadcast({
        type: 'leave',
        username: client.username,
        timestamp: Date.now(),
      }, ws);

      this.sessions.delete(ws);
    }
  }

  private async handleNewMessage(client: ConnectedClient, content: string): Promise<void> {
    if (!content.trim()) return;

    const messageId = crypto.randomUUID();
    const timestamp = Date.now();

    // Store message in memory (in Durable Object storage for persistence)
    const messageData = {
      id: messageId,
      username: client.username,
      content: content.trim(),
      timestamp,
    };

    // Store in Durable Object storage for persistence across restarts
    const messages = (await this.ctx.storage.get('messages')) as unknown[] || [];
    messages.push(messageData);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }
    
    await this.ctx.storage.put('messages', messages);

    // Broadcast message to all connected clients
    this.broadcast({
      type: 'message',
      data: messageData,
    });
  }

  private async sendChatHistory(ws: WebSocket): Promise<void> {
    try {
      // Get messages from Durable Object storage
      const messages = (await this.ctx.storage.get('messages')) as unknown[] || [];

      ws.send(JSON.stringify({
        type: 'history',
        data: messages,
      }));
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }

  private async getMessages(): Promise<Response> {
    try {
      // Get messages from Durable Object storage
      const messages = (await this.ctx.storage.get('messages')) as unknown[] || [];

      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private broadcast(message: WebSocketMessage, excludeWs?: WebSocket): void {
    const messageString = JSON.stringify(message);
    
    for (const [ws] of this.sessions) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageString);
        } catch (error) {
          console.error('Error broadcasting message:', error);
          // Clean up failed connection
          this.sessions.delete(ws);
        }
      }
    }
  }
}

// RPC service entrypoint for Next.js to communicate with
export class ChatRPC {
  async closeAllSessions(): Promise<void> {
    // This could be used to close all chat sessions if needed
    console.log('Closing all chat sessions');
  }
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle chat WebSocket connections
    if (url.pathname.startsWith('/api/chat/')) {
      const roomId = url.pathname.split('/').pop();
      
      if (!roomId) {
        return new Response('Room ID required', { status: 400 });
      }

      // Get Durable Object instance for this chat room
      const id = env.CHAT_ROOM.idFromName(roomId);
      const chatRoom = env.CHAT_ROOM.get(id);
      
      // Forward request to Durable Object
      return chatRoom.fetch(request);
    }

    // For all other requests, return 404
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;