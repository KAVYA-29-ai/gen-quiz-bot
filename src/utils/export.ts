/**
 * Export Utility
 * Handles exporting quiz data to various formats (TXT, PDF)
 */

import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'txt' | 'pdf';
  includeAnswers?: boolean;
  includeExplanations?: boolean;
  title?: string;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

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

/**
 * Exports quiz questions to the specified format
 */
export const exportQuiz = async (
  questions: QuizQuestion[],
  options: ExportOptions
): Promise<void> => {
  const {
    format,
    includeAnswers = true,
    includeExplanations = true,
    title = 'AI Generated Quiz',
    metadata = {}
  } = options;

  if (format === 'txt') {
    exportToTXT(questions, { includeAnswers, includeExplanations, title });
  } else if (format === 'pdf') {
    await exportToPDF(questions, { includeAnswers, includeExplanations, title, metadata });
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Exports quiz to TXT format
 */
const exportToTXT = (
  questions: QuizQuestion[],
  options: { includeAnswers: boolean; includeExplanations: boolean; title: string }
): void => {
  const { includeAnswers, includeExplanations, title } = options;
  
  let content = `${title}\n`;
  content += '='.repeat(title.length) + '\n\n';
  content += `Generated on: ${new Date().toLocaleDateString()}\n`;
  content += `Total Questions: ${questions.length}\n\n`;

  questions.forEach((question, index) => {
    content += `${index + 1}. ${question.question}\n`;
    
    if (question.type === 'mcq' && question.options) {
      question.options.forEach((option, optIndex) => {
        const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
        const marker = includeAnswers && option === question.correct_answer ? '✓' : ' ';
        content += `   ${letter}) ${option} ${marker}\n`;
      });
    } else if (question.type === 'true_false') {
      const trueMarker = includeAnswers && question.correct_answer === true ? '✓' : ' ';
      const falseMarker = includeAnswers && question.correct_answer === false ? '✓' : ' ';
      content += `   True ${trueMarker}\n`;
      content += `   False ${falseMarker}\n`;
    }

    if (includeAnswers) {
      content += `\n   Correct Answer: ${question.correct_answer}\n`;
    }

    if (includeExplanations && question.explanation) {
      content += `\n   Explanation: ${question.explanation}\n`;
    }

    if (question.difficulty) {
      content += `   Difficulty: ${question.difficulty}\n`;
    }

    if (question.topic) {
      content += `   Topic: ${question.topic}\n`;
    }

    content += '\n' + '-'.repeat(80) + '\n\n';
  });

  // Create and download file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(title)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports quiz to PDF format
 */
const exportToPDF = async (
  questions: QuizQuestion[],
  options: {
    includeAnswers: boolean;
    includeExplanations: boolean;
    title: string;
    metadata: any;
  }
): Promise<void> => {
  const { includeAnswers, includeExplanations, title, metadata } = options;
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Set PDF metadata
  pdf.setProperties({
    title: title,
    subject: metadata.subject || 'Quiz Questions',
    author: metadata.author || 'AI Quiz Generator',
    keywords: metadata.keywords?.join(', ') || 'quiz, AI, education',
    creator: 'AI Quiz Generator'
  });

  // Helper function to add new page if needed
  const checkPageBreak = (additionalHeight: number = 0) => {
    if (yPosition + additionalHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const maxWidth = pageWidth - (2 * margin);
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Title page
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(title, pageWidth - (2 * margin));
  
  titleLines.forEach((line: string) => {
    pdf.text(line, margin, yPosition);
    yPosition += 12;
  });

  yPosition += 10;

  // Metadata
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += lineHeight;
  pdf.text(`Total Questions: ${questions.length}`, margin, yPosition);
  yPosition += lineHeight * 2;

  // Add a separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Questions
  questions.forEach((question, index) => {
    checkPageBreak(30); // Ensure space for question header

    // Question number and text
    addWrappedText(`${index + 1}. ${question.question}`, 14, true);
    yPosition += 5;

    // Options
    if (question.type === 'mcq' && question.options) {
      question.options.forEach((option, optIndex) => {
        const letter = String.fromCharCode(65 + optIndex);
        const marker = includeAnswers && option === question.correct_answer ? ' ✓' : '';
        addWrappedText(`   ${letter}) ${option}${marker}`, 11);
      });
    } else if (question.type === 'true_false') {
      const trueMarker = includeAnswers && question.correct_answer === true ? ' ✓' : '';
      const falseMarker = includeAnswers && question.correct_answer === false ? ' ✓' : '';
      addWrappedText(`   True${trueMarker}`, 11);
      addWrappedText(`   False${falseMarker}`, 11);
    }

    yPosition += 5;

    // Answer and explanation
    if (includeAnswers) {
      addWrappedText(`Correct Answer: ${question.correct_answer}`, 10, true);
    }

    if (includeExplanations && question.explanation) {
      addWrappedText(`Explanation: ${question.explanation}`, 10);
    }

    // Additional metadata
    if (question.difficulty || question.topic) {
      yPosition += 3;
      if (question.difficulty) {
        addWrappedText(`Difficulty: ${question.difficulty}`, 9);
      }
      if (question.topic) {
        addWrappedText(`Topic: ${question.topic}`, 9);
      }
    }

    yPosition += 10;

    // Separator line between questions
    if (index < questions.length - 1) {
      checkPageBreak(10);
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
    }
  });

  // Footer on each page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${pageCount} | Generated by AI Quiz Generator`,
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  pdf.save(`${sanitizeFilename(title)}.pdf`);
};

/**
 * Sanitizes filename for safe file system usage
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9\s-_]/gi, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .toLowerCase();
};

/**
 * Generates a summary of the quiz for export
 */
export const generateQuizSummary = (questions: QuizQuestion[]): string => {
  const totalQuestions = questions.length;
  const mcqCount = questions.filter(q => q.type === 'mcq').length;
  const trueFalseCount = questions.filter(q => q.type === 'true_false').length;
  
  const difficulties = questions.reduce((acc, q) => {
    if (q.difficulty) {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topics = questions.reduce((acc, q) => {
    if (q.topic) {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  let summary = `Quiz Summary:\n`;
  summary += `Total Questions: ${totalQuestions}\n`;
  summary += `Multiple Choice: ${mcqCount}\n`;
  summary += `True/False: ${trueFalseCount}\n\n`;

  if (Object.keys(difficulties).length > 0) {
    summary += `Difficulty Distribution:\n`;
    Object.entries(difficulties).forEach(([difficulty, count]) => {
      summary += `  ${difficulty}: ${count}\n`;
    });
    summary += '\n';
  }

  if (Object.keys(topics).length > 0) {
    summary += `Topics Covered:\n`;
    Object.entries(topics).forEach(([topic, count]) => {
      summary += `  ${topic}: ${count} question(s)\n`;
    });
  }

  return summary;
};