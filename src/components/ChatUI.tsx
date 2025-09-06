import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Download, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatUIProps {
  messages: Message[];
  isTyping: boolean;
  onExport: (format: 'txt' | 'pdf') => void;
}

const ChatUI: React.FC<ChatUIProps> = ({ messages, isTyping, onExport }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      });
    }
  };

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center space-x-2 chat-bubble-ai"
    >
      <Bot className="w-5 h-5 text-primary" />
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">AI Quiz Generator</h2>
            <p className="text-sm text-muted-foreground">
              {messages.length > 0 ? `${messages.length} messages` : 'Ready to generate quizzes'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('txt')}
              className="transition-smooth hover:shadow-card"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('pdf')}
              className="transition-smooth hover:shadow-card"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        )}
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/30">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow"
              >
                <Bot className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Welcome to AI Quiz Generator!
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Upload a PDF document to start generating intelligent quizzes with multiple choice and true/false questions.
                </p>
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'gradient-primary text-primary-foreground'
                    } shadow-sm`}
                  >
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </motion.div>

                  <div className={`relative group ${message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {isTyping && (
            <motion.div
              key="typing"
              className="flex justify-start"
            >
              <div className="flex items-start space-x-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-sm"
                >
                  <Bot className="w-4 h-4" />
                </motion.div>
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatUI;