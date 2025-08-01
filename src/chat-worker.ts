import { ChatRoom } from './durable-objects/ChatRoom';

interface Env {
  CHAT_ROOM: DurableObjectNamespace;
}

export { ChatRoom };

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