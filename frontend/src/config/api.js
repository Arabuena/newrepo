const getApiUrl = () => {
  // URL da API na AWS EC2
  const awsUrl = process.env.REACT_APP_API_URL || 'http://52.67.79.225/api';
  return process.env.NODE_ENV === 'production' ? awsUrl : 'http://localhost:5000/api';
};

export const API_URL = getApiUrl(); 