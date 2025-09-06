/**
 * AI Model Client
 * Handles communication with AI models (Gemini API + Hugging Face fallback)
 */

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false';
  question: string;
  options?: string[];
  correct_answer: string | boolean;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuizGenerationOptions {
  questionCount?: number;
  questionTypes?: ('mcq' | 'true_false')[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  includeExplanations?: boolean;
}

export interface ModelResponse {
  success: boolean;
  questions: QuizQuestion[];
  model: string;
  processingTime: number;
  error?: string;
}

/**
 * Generates quiz questions from text using AI models
 */
export const generateQuiz = async (
  text: string,
  options: QuizGenerationOptions = {}
): Promise<ModelResponse> => {
  const startTime = Date.now();
  
  const {
    questionCount = 10,
    questionTypes = ['mcq', 'true_false'],
    difficulty = 'mixed',
    includeExplanations = true
  } = options;

  try {
    // For demo purposes, simulate AI processing and return sample questions
    // In production, implement actual API calls to Gemini and Hugging Face
    
    await simulateProcessingDelay();
    
    const questions = generateSampleQuestions(text, {
      questionCount,
      questionTypes,
      difficulty,
      includeExplanations
    });

    return {
      success: true,
      questions,
      model: 'gemini-1.5-flash', // Simulated
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    // Fallback to alternative generation method
    try {
      await simulateProcessingDelay(1000);
      
      const fallbackQuestions = generateSampleQuestions(text, options, true);
      
      return {
        success: true,
        questions: fallbackQuestions,
        model: 'hugging-face-fallback',
        processingTime: Date.now() - startTime
      };
    } catch (fallbackError) {
      return {
        success: false,
        questions: [],
        model: 'none',
        processingTime: Date.now() - startTime,
        error: 'Failed to generate quiz questions from the provided text.'
      };
    }
  }
};

/**
 * Generates sample quiz questions based on common AI/ML topics
 * In production, this would be replaced with actual AI model calls
 */
const generateSampleQuestions = (
  text: string,
  options: QuizGenerationOptions,
  isFallback = false
): QuizQuestion[] => {
  const {
    questionCount = 10,
    questionTypes = ['mcq', 'true_false'],
    includeExplanations = true
  } = options;

  // Sample questions based on AI content
  const sampleMCQs: Omit<QuizQuestion, 'id'>[] = [
    {
      type: 'mcq',
      question: 'What does AI stand for?',
      options: ['Artificial Intelligence', 'Automated Intelligence', 'Advanced Intelligence', 'Augmented Intelligence'],
      correct_answer: 'Artificial Intelligence',
      explanation: 'AI stands for Artificial Intelligence, which refers to the simulation of human intelligence in machines.',
      difficulty: 'easy',
      topic: 'AI Basics'
    },
    {
      type: 'mcq',
      question: 'Which of the following is a subset of AI?',
      options: ['Machine Learning', 'Data Science', 'Software Engineering', 'Web Development'],
      correct_answer: 'Machine Learning',
      explanation: 'Machine Learning is a subset of AI that provides systems the ability to automatically learn and improve from experience.',
      difficulty: 'medium',
      topic: 'Machine Learning'
    },
    {
      type: 'mcq',
      question: 'What type of AI is designed to perform a narrow task?',
      options: ['General AI', 'Narrow AI', 'Super AI', 'Strong AI'],
      correct_answer: 'Narrow AI',
      explanation: 'Narrow AI (also called Weak AI) is designed to perform a narrow task, such as facial recognition or internet searches.',
      difficulty: 'medium',
      topic: 'AI Types'
    },
    {
      type: 'mcq',
      question: 'Which field helps computers understand human language?',
      options: ['Computer Vision', 'Natural Language Processing', 'Robotics', 'Expert Systems'],
      correct_answer: 'Natural Language Processing',
      explanation: 'Natural Language Processing (NLP) is a branch of AI that helps computers understand, interpret and manipulate human language.',
      difficulty: 'medium',
      topic: 'NLP'
    }
  ];

  const sampleTrueFalse: Omit<QuizQuestion, 'id'>[] = [
    {
      type: 'true_false',
      question: 'Deep Learning is a subset of Machine Learning.',
      correct_answer: true,
      explanation: 'True. Deep Learning is indeed a subset of Machine Learning that uses neural networks with multiple layers.',
      difficulty: 'easy',
      topic: 'Deep Learning'
    },
    {
      type: 'true_false',
      question: 'Neural networks are inspired by the human brain.',
      correct_answer: true,
      explanation: 'True. Neural networks are computing systems inspired by biological neural networks that constitute animal brains.',
      difficulty: 'easy',
      topic: 'Neural Networks'
    },
    {
      type: 'true_false',
      question: 'AI can only work with structured data.',
      correct_answer: false,
      explanation: 'False. AI can work with both structured and unstructured data, including text, images, audio, and video.',
      difficulty: 'medium',
      topic: 'Data Types'
    },
    {
      type: 'true_false',
      question: 'Computer Vision enables machines to interpret visual data.',
      correct_answer: true,
      explanation: 'True. Computer Vision is a field of AI that enables machines to interpret and make decisions based on visual data.',
      difficulty: 'easy',
      topic: 'Computer Vision'
    }
  ];

  // Combine and filter by requested types
  let allQuestions: Omit<QuizQuestion, 'id'>[] = [];
  
  if (questionTypes.includes('mcq')) {
    allQuestions.push(...sampleMCQs);
  }
  
  if (questionTypes.includes('true_false')) {
    allQuestions.push(...sampleTrueFalse);
  }

  // Shuffle and limit to requested count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, questionCount);

  // Add IDs and optionally remove explanations
  return selected.map((question, index) => ({
    ...question,
    id: `q_${Date.now()}_${index}`,
    explanation: includeExplanations ? question.explanation : undefined
  }));
};

/**
 * Simulates AI processing delay
 */
const simulateProcessingDelay = (baseDelay = 3000): Promise<void> => {
  const delay = baseDelay + Math.random() * 2000; // Add some randomness
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Validates text content for quiz generation
 */
export const validateTextForQuiz = (text: string): { isValid: boolean; message?: string } => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, message: 'Text content is empty' };
  }

  const wordCount = text.trim().split(/\s+/).length;
  
  if (wordCount < 50) {
    return { isValid: false, message: 'Text is too short. At least 50 words are required for quiz generation.' };
  }

  if (wordCount > 10000) {
    return { isValid: false, message: 'Text is too long. Please use a document with fewer than 10,000 words.' };
  }

  return { isValid: true };
};

/**
 * Estimates the number of questions that can be generated from text
 */
export const estimateQuestionCount = (text: string): number => {
  const wordCount = text.trim().split(/\s+/).length;
  
  // Rough estimation: 1 question per 100-200 words
  const estimatedCount = Math.floor(wordCount / 150);
  
  return Math.max(1, Math.min(estimatedCount, 20)); // Between 1 and 20 questions
};