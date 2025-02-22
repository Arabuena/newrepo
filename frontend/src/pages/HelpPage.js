import React from 'react';
import { useParams } from 'react-router-dom';
import HelpCenter from '../components/HelpCenter';
import { useAuth } from '../contexts/AuthContext';

export default function HelpPage() {
  const { type } = useParams();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <HelpCenter type={type} />
      </div>
    </div>
  );
} 