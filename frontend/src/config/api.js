const getApiUrl = () => {
  // Substitua pela URL real do seu serviço no Render
  const renderUrl = process.env.REACT_APP_API_URL || 'https://srv-cv2f7r3tq21c73dg326g.onrender.com/api';
  return process.env.NODE_ENV === 'production' ? renderUrl : 'http://localhost:5000/api';
};

export const API_URL = getApiUrl(); 