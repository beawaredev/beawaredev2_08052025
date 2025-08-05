import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatAssistantProps {
  initialPrompt?: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello, I\'m your BeAware scam assistant. I can help you understand what steps to take if you\'ve been scammed. How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare messages for the AI chat API
      const apiMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
      // Call our backend API endpoint
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add AI response with slight delay to simulate thinking
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // If there are citations, add a footnote with them
        if (data.citations && data.citations.length > 0 && data.source === 'perplexity') {
          const citationsContent = "Sources:\n" + data.citations.map((url: string, i: number) => 
            `${i+1}. ${url}`
          ).join('\n');
          
          const citationsMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: citationsContent,
            role: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, citationsMessage]);
        }
        
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <span className="mr-2">BeAware AI Assistant</span>
          <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 py-0.5 px-2 rounded-full">Beta</span>
        </CardTitle>
        <CardDescription>
          Get help and guidance if you've been affected by a scam
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-80 p-4"
        >
          <div className="space-y-4 pb-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  <div 
                    className={cn(
                      "text-xs mt-1",
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <form 
          className="flex w-full items-end gap-2" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about steps to take if you've been scammed..."
            className="min-h-[60px] flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default AIChatAssistant;