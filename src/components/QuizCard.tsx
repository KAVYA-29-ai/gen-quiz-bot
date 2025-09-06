import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  type: 'mcq' | 'true_false';
  question: string;
  options?: string[];
  correct_answer: string | boolean;
  explanation?: string;
}

interface QuizCardProps {
  question: Question;
  index: number;
  onAnswer?: (questionId: string, answer: string | boolean) => void;
  showAnswer?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  index, 
  onAnswer,
  showAnswer = false 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSelect = (answer: string | boolean) => {
    setSelectedAnswer(answer);
    onAnswer?.(question.id, answer);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const isCorrect = selectedAnswer === question.correct_answer;
  const hasAnswered = selectedAnswer !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className="quiz-card group"
    >
      <div className="relative">
        {/* Question Number Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
          className="absolute -top-3 -right-3 z-10"
        >
          <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">
            {index + 1}
          </Badge>
        </motion.div>

        {/* Question Type Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant={question.type === 'mcq' ? 'default' : 'outline'}
            className="transition-smooth"
          >
            {question.type === 'mcq' ? 'Multiple Choice' : 'True/False'}
          </Badge>
          
          {question.explanation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
            >
              {showExplanation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Question Text */}
        <motion.h3 
          className="text-lg font-semibold text-foreground mb-6 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          {question.question}
        </motion.h3>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {question.type === 'mcq' && question.options ? (
            question.options.map((option, optionIndex) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correct_answer;
              const shouldShowCorrect = showAnswer || hasAnswered;
              
              return (
                <motion.button
                  key={optionIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 + optionIndex * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={hasAnswered && showAnswer}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-smooth ${
                    isSelected
                      ? shouldShowCorrect
                        ? isCorrectOption
                          ? 'border-success bg-success/10 text-success'
                          : 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-primary bg-primary/10 text-primary'
                      : shouldShowCorrect && isCorrectOption
                      ? 'border-success bg-success/5 text-success'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1">{option}</span>
                    {shouldShowCorrect && isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {isCorrectOption ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </motion.div>
                    )}
                    {shouldShowCorrect && !isSelected && isCorrectOption && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="w-5 h-5 text-success" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })
          ) : (
            // True/False options
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === question.correct_answer;
                const shouldShowCorrect = showAnswer || hasAnswered;

                return (
                  <motion.button
                    key={option.toString()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 + (option ? 0 : 0.1) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={hasAnswered && showAnswer}
                    className={`p-4 rounded-lg border-2 font-semibold transition-smooth ${
                      isSelected
                        ? shouldShowCorrect
                          ? isCorrectOption
                            ? 'border-success bg-success/10 text-success'
                            : 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-primary bg-primary/10 text-primary'
                        : shouldShowCorrect && isCorrectOption
                        ? 'border-success bg-success/5 text-success'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option ? 'True' : 'False'}</span>
                      {shouldShowCorrect && isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {isCorrectOption ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </motion.div>
                      )}
                      {shouldShowCorrect && !isSelected && isCorrectOption && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <CheckCircle className="w-5 h-5 text-success" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Explanation */}
        {question.explanation && showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50"
          >
            <h4 className="font-medium text-foreground mb-2">Explanation:</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {question.explanation}
            </p>
          </motion.div>
        )}

        {/* Reset Button */}
        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex justify-end"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAnswer(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default QuizCard;