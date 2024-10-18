// File: components/AIChat/AIChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AIChatProps {
  isOpen: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen }) => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }]);
      // Here you would typically send the message to an AI service and get a response
      // For now, we'll just echo the message back
      setTimeout(() => {
        setMessages(prev => [...prev, { text: `Echo: ${input}`, isUser: false }]);
      }, 1000);
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-gray-50 border-l border-gray-200 flex flex-col shadow-lg">
      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
      </div>
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-start space-x-2 mb-4`}>
            {!message.isUser && (
              <Avatar className="w-8 h-8">
                <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[80%] p-3 rounded-lg ${
              message.isUser ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-sm ${message.isUser ? 'text-white' : 'text-gray-800'}`}>{message.text}</p>
            </div>
            {message.isUser && (
              <Avatar className="w-8 h-8">
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button onClick={handleSend} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;