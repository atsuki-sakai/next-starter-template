'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatRoom from '../../../components/ChatRoom';

export default function ChatPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Check if username is stored in localStorage
    const storedUsername = localStorage.getItem('chatUsername');
    if (storedUsername) {
      setUsername(storedUsername);
      setIsJoined(true);
    }
  }, []);

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('chatUsername', username.trim());
      setIsJoined(true);
    }
  };

  const handleLeaveChat = () => {
    localStorage.removeItem('chatUsername');
    setUsername('');
    setIsJoined(false);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Join Chat Room
          </h1>
          <div className="mb-4">
            <p className="text-gray-600 text-center">
              Room ID: <span className="font-mono font-semibold">{roomId}</span>
            </p>
          </div>
          <form onSubmit={handleJoinChat} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                required
                minLength={2}
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Chat Room</h1>
          <button
            onClick={handleLeaveChat}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Leave Chat
          </button>
        </div>
        <ChatRoom roomId={roomId} username={username} />
      </div>
    </div>
  );
}