// File: components/AIChat/AIChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AIChatProps {
  isOpen: boolean;
  editorContent: string;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, editorContent }) => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }]);
      generateAIResponse(input);
      setInput('');
    }
  };

  const generateAIResponse = (userInput: string) => {
    setTimeout(() => {
      let aiResponse = '';
      const trimmedContent = editorContent.trim();
      console.log(trimmedContent)

      aiResponse = trimmedContent

      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    }, 1000);
  };


  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="flex-grow overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded-lg ${message.isUser ? 'bg-black text-white' : 'bg-gray-200'}`}>
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI..."
          />
          <Button onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;