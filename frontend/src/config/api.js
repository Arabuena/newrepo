const getApiUrl = () => {
  // Substitua pelo IP ou domínio da sua EC2
  const awsUrl = process.env.REACT_APP_API_URL || 'http://seu-ip-ec2.amazonaws.com/api';
  return process.env.NODE_ENV === 'production' ? awsUrl : 'http://localhost:5000/api';
};

export const API_URL = getApiUrl(); 