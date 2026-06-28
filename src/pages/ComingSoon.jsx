import React from 'react';
import { useLang } from '../context/LangContext';
import { useNavigate } from 'react-router-dom';

function ComingSoon() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
      <div className="w-24 h-24 mb-6 text-gray-400 dark:text-gray-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Module Under Construction</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        This section of the ERP is currently being built in a future batch. Please check back later.
      </p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  );
}

export default ComingSoon;
