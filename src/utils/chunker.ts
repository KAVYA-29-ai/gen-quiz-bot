/**
 * Text Chunking Utility
 * Splits large text into smaller, manageable chunks for AI processing
 */

export interface TextChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
}

export interface ChunkingOptions {
  maxWords?: number;
  maxChars?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
  preserveSentences?: boolean;
}

/**
 * Splits text into chunks based on specified options
 */
export const chunkText = (
  text: string, 
  options: ChunkingOptions = {}
): TextChunk[] => {
  const {
    maxWords = 500,
    maxChars = 3000,
    overlap = 50,
    preserveParagraphs = true,
    preserveSentences = true
  } = options;

  // Clean and normalize text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanText.length === 0) {
    return [];
  }

  // If text is small enough, return as single chunk
  const wordCount = cleanText.split(/\s+/).length;
  if (wordCount <= maxWords && cleanText.length <= maxChars) {
    return [{
      id: generateChunkId(0),
      content: cleanText,
      startIndex: 0,
      endIndex: cleanText.length,
      wordCount
    }];
  }

  const chunks: TextChunk[] = [];
  let currentIndex = 0;
  let chunkCounter = 0;

  while (currentIndex < cleanText.length) {
    let chunkEnd = Math.min(currentIndex + maxChars, cleanText.length);
    let chunkContent = cleanText.substring(currentIndex, chunkEnd);

    // Try to preserve sentence boundaries
    if (preserveSentences && chunkEnd < cleanText.length) {
      const lastSentenceEnd = findLastSentenceEnd(chunkContent);
      if (lastSentenceEnd > chunkContent.length * 0.7) {
        chunkEnd = currentIndex + lastSentenceEnd;
        chunkContent = cleanText.substring(currentIndex, chunkEnd);
      }
    }

    // Try to preserve paragraph boundaries
    if (preserveParagraphs && chunkEnd < cleanText.length) {
      const lastParagraphEnd = findLastParagraphEnd(chunkContent);
      if (lastParagraphEnd > chunkContent.length * 0.6) {
        chunkEnd = currentIndex + lastParagraphEnd;
        chunkContent = cleanText.substring(currentIndex, chunkEnd);
      }
    }

    // Check word count limit
    const currentWordCount = chunkContent.split(/\s+/).length;
    if (currentWordCount > maxWords) {
      chunkContent = trimToWordLimit(chunkContent, maxWords);
      chunkEnd = currentIndex + chunkContent.length;
    }

    chunks.push({
      id: generateChunkId(chunkCounter),
      content: chunkContent.trim(),
      startIndex: currentIndex,
      endIndex: chunkEnd,
      wordCount: chunkContent.trim().split(/\s+/).length
    });

    // Calculate next starting position with overlap
    const overlapChars = Math.min(overlap, chunkContent.length * 0.3);
    currentIndex = chunkEnd - overlapChars;
    chunkCounter++;

    // Prevent infinite loop
    if (currentIndex >= cleanText.length || chunks.length > 100) {
      break;
    }
  }

  return chunks;
};

/**
 * Finds the last sentence ending in the text
 */
const findLastSentenceEnd = (text: string): number => {
  const sentenceEnders = /[.!?]+\s/g;
  let lastMatch = -1;
  let match;

  while ((match = sentenceEnders.exec(text)) !== null) {
    lastMatch = match.index + match[0].length;
  }

  return lastMatch > 0 ? lastMatch : text.length;
};

/**
 * Finds the last paragraph ending in the text
 */
const findLastParagraphEnd = (text: string): number => {
  const lastParagraph = text.lastIndexOf('\n\n');
  return lastParagraph > 0 ? lastParagraph + 2 : text.length;
};

/**
 * Trims text to specified word limit
 */
const trimToWordLimit = (text: string, wordLimit: number): string => {
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) {
    return text;
  }
  
  return words.slice(0, wordLimit).join(' ');
};

/**
 * Generates a unique chunk ID
 */
const generateChunkId = (index: number): string => {
  return `chunk_${index}_${Date.now()}`;
};

/**
 * Merges overlapping chunks if they have similar content
 */
export const deduplicateChunks = (chunks: TextChunk[]): TextChunk[] => {
  if (chunks.length <= 1) return chunks;

  const deduplicated: TextChunk[] = [chunks[0]];
  
  for (let i = 1; i < chunks.length; i++) {
    const current = chunks[i];
    const previous = deduplicated[deduplicated.length - 1];
    
    const similarity = calculateSimilarity(current.content, previous.content);
    
    if (similarity < 0.7) { // Less than 70% similar
      deduplicated.push(current);
    }
  }

  return deduplicated;
};

/**
 * Calculates similarity between two text chunks (simple implementation)
 */
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Analyzes chunk distribution and quality
 */
export const analyzeChunks = (chunks: TextChunk[]) => {
  const wordCounts = chunks.map(chunk => chunk.wordCount);
  const charCounts = chunks.map(chunk => chunk.content.length);
  
  return {
    totalChunks: chunks.length,
    avgWordCount: wordCounts.reduce((a, b) => a + b, 0) / chunks.length,
    avgCharCount: charCounts.reduce((a, b) => a + b, 0) / chunks.length,
    minWordCount: Math.min(...wordCounts),
    maxWordCount: Math.max(...wordCounts),
    minCharCount: Math.min(...charCounts),
    maxCharCount: Math.max(...charCounts)
  };
};