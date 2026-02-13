import React from 'react';
import katex from 'katex';

interface MathDisplayProps {
  text: string;
  className?: string;
}

const MathDisplay: React.FC<MathDisplayProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by math delimiters $...$
  const parts = text.split(/(\$[^\$]+\$)/g);

  return (
    <div className={`text-gray-800 leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1);
            try {
                // Use katex directly to render HTML string
                const html = katex.renderToString(math, {
                    throwOnError: false,
                    displayMode: false
                });
                return (
                    <span 
                        key={index} 
                        className="mx-1 inline-block" 
                        dangerouslySetInnerHTML={{ __html: html }} 
                    />
                );
            } catch (error) {
                console.warn("Katex error:", error);
                return <span key={index} className="text-red-500 font-mono">{part}</span>;
            }
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

export default MathDisplay;