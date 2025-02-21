import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [availableRide, setAvailableRide] = useState(null);
  const [earnings, setEarnings] = useState('0,00');
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const [showRideTimer, setShowRideTimer] = useState(null);
  const pollIntervalRef = useRef(null);
  const showHideIntervalRef = useRef(null);
  const currentTimerRef = useRef(null);
  
  // Constantes para os tempos
  const SHOW_TIME = 15000; // 15 segundos
  const HIDE_TIME = 10000; // 10 segundos

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

          // Adiciona marcador do motorista
          markerRef.current = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: mapInstanceRef.current,
            title: 'Sua localização'
          });

          // Atualiza localização no backend
          updateDriverLocation(latitude, longitude);
        }
      );
    }
  }, []);

  // Atualiza localização periodicamente
  useEffect(() => {
    let locationInterval;
    if (isOnline) {
      locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (markerRef.current) {
              markerRef.current.setPosition({ lat: latitude, lng: longitude });
            }
            updateDriverLocation(latitude, longitude);
          }
        );
      }, 10000); // Atualiza a cada 10 segundos
    }
    return () => clearInterval(locationInterval);
  }, [isOnline]);

  // Função para limpar todos os timers e estados
  const clearAllTimers = useCallback(() => {
    console.log('Limpando todos os timers...'); // Debug
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (currentTimerRef.current) {
      clearTimeout(currentTimerRef.current);
      currentTimerRef.current = null;
    }
    // Parar e resetar o áudio
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAvailableRide(null);
  }, []);

  // Efeito para limpar tudo quando ficar offline
  useEffect(() => {
    if (!isOnline) {
      console.log('Motorista ficou offline, limpando tudo...'); // Debug
      clearAllTimers();
    }
  }, [isOnline, clearAllTimers]);

  // Polling para buscar corridas disponíveis
  useEffect(() => {
    console.log('Status online:', isOnline); // Debug

    const handleShowHide = (ride) => {
      console.log('handleShowHide chamado com:', ride);
      
      if (!ride || !isOnline) {
        console.log('Condições não atendidas para mostrar corrida');
        // Garantir que o áudio pare se estiver tocando
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        return;
      }

      // Mostra a corrida
      console.log('Mostrando corrida:', ride);
      setAvailableRide(ride);
      
      // Só toca o áudio se estiver online
      if (isOnline) {
        audioRef.current.play();
      }

      // Timer para esconder
      currentTimerRef.current = setTimeout(() => {
        console.log('Escondendo corrida');
        setAvailableRide(null);

        // Timer para mostrar novamente
        currentTimerRef.current = setTimeout(() => {
          if (isOnline) {
            console.log('Mostrando corrida novamente');
            handleShowHide(ride);
          }
        }, HIDE_TIME);
      }, SHOW_TIME);
    };

    let pollInterval = null;

    if (isOnline && !currentRide) {
      pollInterval = setInterval(async () => {
        try {
          const response = await api.get('/rides/available');
          console.log('Resposta da API:', response.data);

          if (response.data && response.data.length > 0 && isOnline) {
            const newRide = response.data[0];
            console.log('Nova corrida encontrada:', newRide);
            handleShowHide(newRide);
          }
        } catch (error) {
          console.error('Erro ao buscar corridas:', error.response?.data || error);
        }
      }, SHOW_TIME + HIDE_TIME);

      pollIntervalRef.current = pollInterval;
    }

    return () => {
      console.log('Limpando efeito de polling');
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (currentTimerRef.current) {
        clearTimeout(currentTimerRef.current);
      }
    };
  }, [isOnline, currentRide]);

  const updateDriverLocation = async (latitude, longitude) => {
    try {
      await api.patch('/users/location', {
        coordinates: [longitude, latitude]
      });
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      // Não mostra erro visual para não poluir a interface
    }
  };

  const handleStatusToggle = async () => {
    try {
      const newStatus = !isOnline;
      console.log('Alterando status para:', newStatus ? 'online' : 'offline');

      const response = await api.patch('/users/availability', {
        isAvailable: newStatus
      });

      if (response.data) {
        setIsOnline(newStatus);
        if (!newStatus) { // Se está ficando offline
          console.log('Ficando offline via toggle...');
          // Parar o áudio imediatamente
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          clearAllTimers();
        }
        setError('');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError(error.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const handleAcceptRide = async () => {
    if (!availableRide) return;

    if (currentTimerRef.current) {
      clearTimeout(currentTimerRef.current);
      currentTimerRef.current = null;
    }

    try {
      const response = await api.post(`/rides/accept/${availableRide._id}`);
      setCurrentRide(response.data);
      setAvailableRide(null);

      // Adiciona rota ao mapa
      if (window.google && mapInstanceRef.current) {
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer();
        directionsRenderer.setMap(mapInstanceRef.current);

        const result = await directionsService.route({
          origin: { lat: response.data.origin.lat, lng: response.data.origin.lng },
          destination: { lat: response.data.destination.lat, lng: response.data.destination.lng },
          travelMode: window.google.maps.TravelMode.DRIVING
        });

        directionsRenderer.setDirections(result);
      }
    } catch (error) {
      setError('Erro ao aceitar corrida');
      console.error(error);
    }
  };

  // Função para recusar corrida
  const handleDeclineRide = () => {
    if (currentTimerRef.current) {
      clearTimeout(currentTimerRef.current);
      currentTimerRef.current = null;
    }
    setAvailableRide(null);
  };

  return (
    <div className="h-full flex flex-col relative">
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

      {/* Debug info com mais detalhes - Ajustado para top-32 (era top-24) */}
      <div className="fixed top-32 right-4 bg-white p-2 rounded shadow z-20">
        <p>Online: {isOnline ? 'Sim' : 'Não'}</p>
        <p>Corrida disponível: {availableRide ? 'Sim' : 'Não'}</p>
        <p>Timer ativo: {currentTimerRef.current ? 'Sim' : 'Não'}</p>
      </div>

      {/* Notificação de Corrida Disponível */}
      {availableRide && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-6 animate-slide-up z-30">
          <div className="max-w-xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Nova solicitação de corrida!</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Origem:</span> {availableRide.origin.address}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Destino:</span> {availableRide.destination.address}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Distância</p>
                  <p className="text-sm text-gray-900">{(availableRide.distance / 1000).toFixed(1)} km</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Tempo est.</p>
                  <p className="text-sm text-gray-900">{Math.round(availableRide.duration / 60)} min</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Valor</p>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {availableRide.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAcceptRide}
                className="flex-1 bg-green-500 text-white py-4 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Aceitar Corrida
              </button>
              <button
                onClick={handleDeclineRide}
                className="flex-1 bg-gray-200 text-gray-800 py-4 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Recusar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-20 left-0 right-0 mx-4 z-40">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        </div>
      )}
    </div>
  );
} 