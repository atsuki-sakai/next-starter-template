interface Env {
  CHAT_SERVICE: Fetcher;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
): Promise<Response> {
  try {
    // For development, return a placeholder
    if (process.env.NODE_ENV === 'development') {
      return new Response('WebSocket connections not supported in development mode', {
        status: 501,
      });
    }

    const { roomId } = await params;
    
    // In production, forward the request to the chat worker
    const env = process.env as unknown as Env;
    if (env.CHAT_SERVICE) {
      const url = new URL(request.url);
      url.pathname = `/api/chat/${roomId}`;
      return env.CHAT_SERVICE.fetch(url.toString(), request);
    }

    return new Response('Chat service not available', { status: 503 });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}