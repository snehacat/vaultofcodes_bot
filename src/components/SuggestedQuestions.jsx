import React from 'react';

function SuggestedQuestions({ questions, onQuestionClick }) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="text-center">
        <p className="text-sm text-gray-600 font-semibold mb-4 flex items-center justify-center gap-2">
          <span className="text-primary">✨</span>
          Popular Questions
          <span className="text-primary">✨</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question.query)}
            className="group bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-purple-50 border-2 border-gray-200 hover:border-primary rounded-xl p-4 text-left flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
              {question.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
              {question.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SuggestedQuestions;
