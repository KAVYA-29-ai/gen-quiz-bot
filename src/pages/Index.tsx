import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, FileText, Sparkles, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import FileUpload from '@/components/FileUpload';
import ChatUI from '@/components/ChatUI';
import QuizCard from '@/components/QuizCard';
import Loader from '@/components/Loader';

import { parsePDF, type ParsedPDF } from '@/utils/pdfParser';
import { chunkText, type TextChunk } from '@/utils/chunker';
import { generateQuiz, type QuizQuestion, type ModelResponse } from '@/utils/modelClient';
import { exportQuiz } from '@/utils/export';
import { quizCache, cacheUtils } from '@/utils/cache';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

type AppState = 'upload' | 'processing' | 'chat' | 'quiz';

const Index: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [parsedPDF, setParsedPDF] = useState<ParsedPDF | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [processingStage, setProcessingStage] = useState<'uploading' | 'parsing' | 'generating' | 'finishing'>('uploading');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const addMessage = useCallback((type: 'user' | 'ai', content: string) => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setCurrentFile(file);
    setIsProcessing(true);
    setAppState('processing');
    setProcessingStage('uploading');
    setProgress(10);

    try {
      // Check cache first
      const cacheKey = cacheUtils.createPdfKey(file.name, file.size);
      const cachedPDF = quizCache.get(cacheKey);
      
      if (cachedPDF) {
        setParsedPDF(cachedPDF);
        setProgress(100);
        setAppState('chat');
        addMessage('ai', `Welcome! I've loaded your document "${file.name}". It contains ${cachedPDF.wordCount} words across ${cachedPDF.pages} pages. I'm ready to generate quiz questions from this content. What type of quiz would you like me to create?`);
        setIsProcessing(false);
        return;
      }

      addMessage('user', `Uploaded: ${file.name}`);
      
      // Parse PDF
      setProcessingStage('parsing');
      setProgress(30);
      
      const parsed = await parsePDF(file);
      setParsedPDF(parsed);
      
      // Cache the parsed PDF
      quizCache.set(cacheKey, parsed, 24 * 60 * 60 * 1000); // 24 hours
      
      setProgress(60);
      setProcessingStage('finishing');
      
      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgress(100);
      setAppState('chat');
      
      addMessage('ai', `Great! I've successfully processed your PDF "${file.name}". Here's what I found:

📄 Document: ${parsed.metadata?.title || file.name}
📊 Word Count: ${parsed.wordCount} words
📖 Pages: ${parsed.pages} pages
⏱️ Estimated Reading Time: ${Math.ceil(parsed.wordCount / 200)} minutes

I'm ready to generate intelligent quiz questions from this content! I can create:

• Multiple Choice Questions (MCQ)
• True/False Questions
• Mixed difficulty levels
• Questions with detailed explanations

What type of quiz would you like me to generate? Just let me know your preferences!`);

    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process the PDF. Please try again.",
        variant: "destructive",
      });
      setAppState('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, toast]);

  const handleGenerateQuiz = useCallback(async () => {
    if (!parsedPDF) return;

    setIsProcessing(true);
    setProcessingStage('generating');
    setProgress(0);

    try {
      addMessage('user', 'Generate a comprehensive quiz from this document');
      
      // Check cache for quiz
      const textHash = cacheUtils.generateTextHash(parsedPDF.text);
      const quizOptions = { questionCount: 10, questionTypes: ['mcq', 'true_false'] as ('mcq' | 'true_false')[], includeExplanations: true };
      const cacheKey = cacheUtils.createQuizKey(textHash, quizOptions);
      
      const cachedQuiz = quizCache.get(cacheKey);
      if (cachedQuiz) {
        setQuizQuestions(cachedQuiz.questions);
        setAppState('quiz');
        addMessage('ai', `I've generated ${cachedQuiz.questions.length} quiz questions from your document! The quiz includes both multiple choice and true/false questions with explanations. You can review them below and export when ready.`);
        setIsProcessing(false);
        return;
      }

      // Simulate typing effect for AI response
      const typingMessage: Message = {
        id: `typing_${Date.now()}`,
        type: 'ai',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, typingMessage]);

      // Generate quiz
      setProgress(30);
      const chunks = chunkText(parsedPDF.text, { maxWords: 500, overlap: 50 });
      
      setProgress(60);
      const response: ModelResponse = await generateQuiz(parsedPDF.text, quizOptions);
      
      if (response.success && response.questions.length > 0) {
        setQuizQuestions(response.questions);
        
        // Cache the quiz
        quizCache.set(cacheKey, response, 60 * 60 * 1000); // 1 hour
        
        setProgress(100);
        setAppState('quiz');
        
        // Remove typing message and add final response
        setMessages(prev => prev.slice(0, -1));
        addMessage('ai', `Excellent! I've generated ${response.questions.length} comprehensive quiz questions from your document. The quiz includes:

📝 ${response.questions.filter(q => q.type === 'mcq').length} Multiple Choice Questions
✅ ${response.questions.filter(q => q.type === 'true_false').length} True/False Questions
📚 All questions include detailed explanations
⚡ Generated using ${response.model} in ${Math.round(response.processingTime / 1000)}s

You can review each question below, see the correct answers, and export the quiz in TXT or PDF format when you're ready!`);

        toast({
          title: "Quiz generated successfully!",
          description: `Created ${response.questions.length} questions from your document.`,
        });
      } else {
        throw new Error(response.error || 'Failed to generate quiz questions');
      }

    } catch (error) {
      console.error('Quiz generation error:', error);
      setMessages(prev => prev.slice(0, -1));
      addMessage('ai', `I apologize, but I encountered an issue while generating the quiz. This could be due to:

• The document content might be too complex or unclear
• Temporary processing issues
• The text might not contain enough educational content

Please try uploading a different document or contact support if the issue persists.`);
      
      toast({
        title: "Quiz generation failed",
        description: "Please try again or upload a different document.",
        variant: "destructive",
      });
      setAppState('chat');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedPDF, addMessage, toast]);

  const handleExport = useCallback(async (format: 'txt' | 'pdf') => {
    if (quizQuestions.length === 0) return;

    try {
      await exportQuiz(quizQuestions, {
        format,
        includeAnswers: true,
        includeExplanations: true,
        title: parsedPDF?.metadata?.title || currentFile?.name || 'AI Generated Quiz',
        metadata: {
          author: 'AI Quiz Generator',
          subject: 'Educational Assessment',
          keywords: ['quiz', 'ai-generated', 'education']
        }
      });

      toast({
        title: "Export successful!",
        description: `Quiz exported as ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export quiz. Please try again.",
        variant: "destructive",
      });
    }
  }, [quizQuestions, parsedPDF, currentFile, toast]);

  const handleRestart = useCallback(() => {
    setAppState('upload');
    setCurrentFile(null);
    setParsedPDF(null);
    setMessages([]);
    setQuizQuestions([]);
    setIsProcessing(false);
    setProgress(0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Quiz Generator</h1>
                <p className="text-sm text-muted-foreground">Transform PDFs into intelligent quizzes</p>
              </div>
            </motion.div>

            {appState !== 'upload' && (
              <Button
                variant="outline"
                onClick={handleRestart}
                className="transition-smooth hover:shadow-card"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {appState === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full gradient-hero flex items-center justify-center shadow-glow"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Upload Your PDF Document
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Transform any PDF into an intelligent quiz with AI-powered question generation. 
                  Get multiple choice and true/false questions with detailed explanations.
                </p>
              </div>

              <FileUpload
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
              />

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid md:grid-cols-3 gap-6 mt-12"
              >
                {[
                  {
                    icon: FileText,
                    title: 'Smart PDF Processing',
                    description: 'Advanced text extraction and content analysis'
                  },
                  {
                    icon: Brain,
                    title: 'AI-Powered Questions',
                    description: 'Intelligent question generation with explanations'
                  },
                  {
                    icon: Download,
                    title: 'Export Options',
                    description: 'Download as TXT or beautifully formatted PDF'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="gradient-card p-6 rounded-xl shadow-card border border-border/50 text-center transition-smooth hover:shadow-elevated"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {appState === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <Loader
                text={
                  processingStage === 'uploading' ? 'Uploading your PDF...' :
                  processingStage === 'parsing' ? 'Extracting text content...' :
                  processingStage === 'generating' ? 'Generating quiz questions...' :
                  'Finalizing your quiz...'
                }
                progress={progress}
                stage={processingStage}
              />
            </motion.div>
          )}

          {appState === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ChatUI
                    messages={messages}
                    isTyping={isProcessing}
                    onExport={handleExport}
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="gradient-card p-6 rounded-xl shadow-card border border-border/50 sticky top-24"
                  >
                    <h3 className="font-semibold text-foreground mb-4">Document Info</h3>
                    
                    {parsedPDF && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pages:</span>
                          <span className="font-medium">{parsedPDF.pages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Words:</span>
                          <span className="font-medium">{parsedPDF.wordCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Reading:</span>
                          <span className="font-medium">{Math.ceil(parsedPDF.wordCount / 200)} min</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-border/30">
                      <Button
                        onClick={handleGenerateQuiz}
                        disabled={isProcessing || !parsedPDF}
                        className="w-full gradient-primary text-primary-foreground hover:shadow-glow transition-smooth"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Quiz
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {appState === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              {/* Quiz Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center shadow-glow"
                >
                  <Brain className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Your AI-Generated Quiz</h2>
                <p className="text-muted-foreground">
                  {quizQuestions.length} questions ready for review
                </p>
              </div>

              {/* Export Controls */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center space-x-4 mb-8"
              >
                <Button
                  variant="outline"
                  onClick={() => handleExport('txt')}
                  className="transition-smooth hover:shadow-card"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export TXT
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  className="transition-smooth hover:shadow-card"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </motion.div>

              {/* Quiz Questions */}
              <div className="grid lg:grid-cols-2 gap-6">
                {quizQuestions.map((question, index) => (
                  <QuizCard
                    key={question.id}
                    question={question}
                    index={index}
                    showAnswer={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;