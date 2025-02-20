import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [earnings, setEarnings] = useState('0,00');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showRideRequest, setShowRideRequest] = useState(false);
  const audioRef = useRef(new Audio('/notification.mp3'));

  // Inicializa o mapa
  useEffect(() => {
    if (!mapInstanceRef.current && window.google) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: latitude, lng: longitude },
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true
          });
        }
      );
    }
  }, []);

  // Polling para buscar corridas disponíveis
  useEffect(() => {
    let pollInterval;
    
    if (isOnline) {
      pollInterval = setInterval(async () => {
        try {
          const response = await api.get('/rides/available');
          if (response.data && response.data.length > 0) {
            const newRide = response.data[0];
            setCurrentRide(newRide);
            setShowRideRequest(true);
            audioRef.current.play();
            
            // Esconde a notificação após 15 segundos
            setTimeout(() => {
              setShowRideRequest(false);
              setCurrentRide(null);
            }, 15000);
          }
        } catch (error) {
          console.error('Erro ao buscar corridas:', error);
        }
      }, 5000); // Verifica a cada 5 segundos
    }

    return () => clearInterval(pollInterval);
  }, [isOnline]);

  const handleStatusToggle = () => {
    setIsOnline(!isOnline);
  };

  const handleAcceptRide = async () => {
    if (!currentRide) return;

    try {
      await api.post(`/rides/accept/${currentRide._id}`);
      setShowRideRequest(false);
      // Navegar para a tela de corrida ativa
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mapa */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="text-lg font-semibold">
              R$ {earnings}
            </div>
          </div>
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-full text-white text-sm font-medium ${
              isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isOnline ? 'Ficar Offline' : 'Ficar Online'}
          </button>
        </div>
      </div>

      {/* Notificação de Corrida */}
      {showRideRequest && currentRide && (
        <div className="absolute bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-6 animate-slide-up">
          <div className="max-w-xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">Nova solicitação de corrida!</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Origem:</span> {currentRide.origin.address}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Destino:</span> {currentRide.destination.address}
              </p>
              <p className="text-lg font-semibold text-green-600">
                R$ {currentRide.price.toFixed(2)}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAcceptRide}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600"
              >
                Aceitar
              </button>
              <button
                onClick={() => setShowRideRequest(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                Recusar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 