'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: number;
}

interface ChatRoomProps {
  roomId: string;
  username: string;
}

export default function ChatRoom({ roomId, username }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      setConnectionStatus('Development Mode - WebSocket not available');
      setIsConnected(false);
      
      // Add some mock messages for UI testing
      setTimeout(() => {
        setMessages([
          {
            id: '1',
            username: 'System',
            content: 'This is development mode. WebSocket functionality requires production deployment.',
            timestamp: Date.now() - 60000,
          },
          {
            id: '2',
            username: 'Demo User',
            content: 'Hello! This is a sample message to show the UI.',
            timestamp: Date.now() - 30000,
          },
        ]);
      }, 1000);
      return;
    }

    try {
      // In production, connect to the chat worker directly
      const protocol = 'wss:'; // Always use secure WebSocket for production
      const wsUrl = `${protocol}//chat-worker.atk721.workers.dev/api/chat/${roomId}?username=${encodeURIComponent(username)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('Connected');
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              setMessages(prev => [...prev, data.data]);
              break;
            case 'history':
              setMessages(data.data);
              break;
            case 'join':
              setMessages(prev => [...prev, {
                id: `join-${Date.now()}`,
                username: 'System',
                content: `${data.username} joined the chat`,
                timestamp: data.timestamp,
              }]);
              break;
            case 'leave':
              setMessages(prev => [...prev, {
                id: `leave-${Date.now()}`,
                username: 'System',
                content: `${data.username} left the chat`,
                timestamp: data.timestamp,
              }]);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            setConnectionStatus('Reconnecting...');
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Connection Error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('Connection Failed');
    }
  }, [roomId, username]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      return;
    }

    // Development mode: simulate message sending
    if (process.env.NODE_ENV === 'development') {
      const newMessage = {
        id: `dev-${Date.now()}`,
        username: username,
        content: inputMessage.trim(),
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      return;
    }

    // Production mode: send via WebSocket
    if (!isConnected) {
      return;
    }

    const message = {
      type: 'message',
      content: inputMessage.trim(),
    };

    wsRef.current?.send(JSON.stringify(message));
    setInputMessage('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto border border-gray-300 rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Chat Room: {roomId}
          </h2>
          <p className="text-sm text-gray-600">Logged in as: {username}</p>
        </div>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">{connectionStatus}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 italic">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.username === username ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.username === username
                    ? 'bg-blue-500 text-white'
                    : message.username === 'System'
                    ? 'bg-gray-200 text-gray-600 text-sm italic'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.username !== username && message.username !== 'System' && (
                  <div className="text-xs font-medium mb-1 text-gray-600">
                    {message.username}
                  </div>
                )}
                <div className="break-words">{message.content}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}