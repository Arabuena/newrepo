const getApiUrl = () => {
  const renderUrl = process.env.REACT_APP_API_URL || 'https://leva-backend.onrender.com/api';
  return process.env.NODE_ENV === 'production' ? renderUrl : 'http://localhost:5000/api';
};

export const API_URL = getApiUrl(); 