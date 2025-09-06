import React from 'react';
import { motion } from 'framer-motion';
import { Brain, FileText, Sparkles } from 'lucide-react';

interface LoaderProps {
  text?: string;
  progress?: number;
  stage?: 'uploading' | 'parsing' | 'generating' | 'finishing';
}

const Loader: React.FC<LoaderProps> = ({ 
  text = "Processing...", 
  progress = 0,
  stage = 'parsing'
}) => {
  const getStageIcon = () => {
    switch (stage) {
      case 'uploading':
        return FileText;
      case 'parsing':
        return FileText;
      case 'generating':
        return Brain;
      case 'finishing':
        return Sparkles;
      default:
        return Brain;
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'uploading':
        return 'text-blue-500';
      case 'parsing':
        return 'text-yellow-500';
      case 'generating':
        return 'text-purple-500';
      case 'finishing':
        return 'text-green-500';
      default:
        return 'text-primary';
    }
  };

  const StageIcon = getStageIcon();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center p-8 space-y-6"
    >
      {/* Animated Icon */}
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
          <StageIcon className={`w-8 h-8 text-primary-foreground`} />
        </div>
        
        {/* Orbiting dots */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${i * 120}deg) translateX(30px) translateY(-1px)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Progress Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h3 className="text-lg font-semibold text-foreground">
          {text}
        </h3>
        <p className="text-sm text-muted-foreground">
          This might take a few moments...
        </p>
      </motion.div>

      {/* Progress Bar */}
      {progress > 0 && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          className="w-full max-w-xs"
        >
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full shadow-glow"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground text-center mt-2"
          >
            {Math.round(progress)}% complete
          </motion.p>
        </motion.div>
      )}

      {/* Stage Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center space-x-3"
      >
        {['uploading', 'parsing', 'generating', 'finishing'].map((stageItem, index) => (
          <motion.div
            key={stageItem}
            className={`flex items-center space-x-1 ${
              stage === stageItem ? 'text-primary' : 'text-muted-foreground'
            }`}
            animate={stage === stageItem ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                stage === stageItem 
                  ? 'bg-primary shadow-glow' 
                  : index < ['uploading', 'parsing', 'generating', 'finishing'].indexOf(stage)
                  ? 'bg-success'
                  : 'bg-muted-foreground/30'
              }`}
            />
            <span className="text-xs font-medium capitalize">{stageItem}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Loader;