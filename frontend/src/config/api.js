const getApiUrl = () => {
  // URL da API na AWS EC2 (usando HTTPS)
  const awsUrl = process.env.REACT_APP_API_URL || 'https://52.67.79.225/api';
  return process.env.NODE_ENV === 'production' ? awsUrl : 'http://localhost:5000/api';
};

export const API_URL = getApiUrl(); 