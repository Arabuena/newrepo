import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { LoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ['places'];

// Adiciona função de debounce
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Adicione estas constantes no topo do arquivo
const CONNECTION_CHECK_INTERVAL = 10000; // 10 segundos
const MAX_RETRIES = 3;
const LOCATION_UPDATE_INTERVAL = 10000; // 10 segundos

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [availableRide, setAvailableRide] = useState(null);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const pollingIntervalRef = useRef(null);
  const SHOW_TIME = 15000;
  const HIDE_TIME = 10000;
  const DECLINE_TIMEOUT = 45000;
  const [declinedRideId, setDeclinedRideId] = useState(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const POLLING_INTERVAL = 15000;
  const audioRef = useRef(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const debouncedFetch = useRef(
    debounce(async () => {
      if (!isOnline || currentRide) {
        console.log('Ignorando busca de corridas:', { isOnline, hasCurrent: !!currentRide });
        return;
      }

      try {
        console.log('Buscando corridas disponíveis...');
        const response = await api.get('/rides/available');
        console.log('Resposta da busca:', response.data);
        
        if (response.data.length > 0) {
          const ride = response.data[0];
          console.log('Nova corrida encontrada:', ride);
          
          if (ride._id !== declinedRideId) {
            setAvailableRide(ride);
            playNotification();
          }
        }
      } catch (error) {
        console.error('Erro ao buscar corridas:', error);
      }
    }, 1000)
  ).current;

  // Inicializa o áudio de forma simples e direta
  useEffect(() => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.preload = 'auto';
    audio.volume = 1.0;
    audioRef.current = audio;

    // Cleanup quando o componente é desmontado
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Função simples para tocar o som
  const playNotification = useCallback(() => {
    if (!audioRef.current || !isOnline) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Erro ao tocar áudio:', error);
      });
    } catch (error) {
      console.error('Erro ao manipular áudio:', error);
    }
  }, [isOnline]);

  // Função para atualizar a rota no mapa
  const updateMapRoute = useCallback(async (ride, isDestination = false) => {
    if (!window.google || !directionsRenderer) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const origin = isDestination ? ride.origin : currentLocation;
      const destination = isDestination ? ride.destination : ride.origin;
      
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      
      directionsRenderer.setDirections(result);
      setDirections(result);
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
    }
  }, [currentLocation, directionsRenderer]);

  // 2. Depois definir clearMapRoute
  const clearMapRoute = useCallback(() => {
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      setDirectionsRenderer(null);
    }
  }, [directionsRenderer]);

  // Defina renderMarker usando useCallback antes de usá-lo
  const renderMarker = useCallback((position) => {
    if (!position || !window.google || !mapRef.current) return null;

    // Usa o Marker padrão em vez do AdvancedMarkerElement
    return new window.google.maps.Marker({
      position,
      map: mapRef.current,
      title: "Sua localização",
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    if (currentLocation) {
      renderMarker(currentLocation);
    }
  }, [currentLocation, renderMarker]);

  const updateLocation = useCallback(async (position) => {
    try {
      const { latitude, longitude } = position;
      console.log('Atualizando localização:', { latitude, longitude });

      const locationData = {
        coordinates: [longitude, latitude],
        type: 'Point'
      };

      console.log('Enviando dados:', locationData);
      
      const response = await api.patch('/users/location', locationData);
      console.log('Localização atualizada:', response.data);
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      setError('Erro ao atualizar localização');
    }
  }, []);

  // Atualiza localização periodicamente
  useEffect(() => {
    let watchId;
    let marker = null;

    if (navigator.geolocation && isOnline) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          updateLocation(position.coords);

          if (marker) {
            marker.setMap(null);
          }
          marker = renderMarker(location);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter sua localização');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [isOnline, updateLocation, renderMarker]);

  // 1. Primeiro definir stopPolling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Parando polling...');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 2. Depois definir startPolling que usa stopPolling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Polling já está ativo');
      return;
    }

    console.log('Iniciando novo polling...');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        if (!isOnline || currentRide) {
          console.log('Condições não permitem polling:', { isOnline, hasCurrent: !!currentRide });
          stopPolling();
          return;
        }

        const response = await api.get('/rides/available');
        console.log('Resposta do polling:', response.data);
        
        if (response.data.length > 0) {
          const ride = response.data[0];
          if (ride._id !== declinedRideId) {
            setAvailableRide(ride);
            if (document.documentElement.hasAttribute('data-user-interacted')) {
              playNotification();
            }
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 5000);
    
    console.log('Polling iniciado com sucesso');
  }, [isOnline, currentRide, declinedRideId, playNotification, stopPolling]);

  // 3. Depois os useEffects que usam essas funções
  useEffect(() => {
    let isMounted = true;

    const fetchCurrentRide = async () => {
      if (!isOnline || !isMounted) return;

      try {
        console.log('Buscando corrida atual...');
        const response = await api.get('/rides/current');
        
        if (!isMounted) return;

        // Se não há corrida atual
        if (!response.data) {
          // Limpa os estados apenas se havia uma corrida anteriormente
          if (currentRide) {
            console.log('Limpando estados da corrida anterior');
            setCurrentRide(null);
            setRideStatus(null);
            setDirections(null);
            setAvailableRide(null);
            
            if (directionsRenderer) {
              directionsRenderer.setMap(null);
              setDirectionsRenderer(null);
            }
          }
          
          // Inicia polling apenas se estiver online e não houver corrida
          if (isOnline) {
            startPolling();
          }
          return;
        }

        // Se há uma corrida atual
        const ride = response.data;
        
        // Não atualiza se a corrida já foi finalizada
        if (ride.status === 'completed') {
          console.log('Ignorando corrida finalizada:', ride._id);
          // Limpa todos os estados
          setCurrentRide(null);
          setRideStatus(null);
          setDirections(null);
          setAvailableRide(null);
          
          if (directionsRenderer) {
            directionsRenderer.setMap(null);
            setDirectionsRenderer(null);
          }
          
          // Reinicia o polling
          if (isOnline) {
            startPolling();
          }
          return;
        }

        // Atualiza apenas se necessário
        if (!currentRide || currentRide._id !== ride._id || currentRide.status !== ride.status) {
          console.log('Atualizando corrida atual:', ride);
          setCurrentRide(ride);
          setRideStatus(ride.status);
          updateMapRoute(ride, ride.status === 'in_progress');
          stopPolling();
        }
      } catch (error) {
        console.error('Erro ao buscar corrida atual:', error);
      }
    };

    // Executa a busca imediatamente
    fetchCurrentRide();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [isOnline, currentRide, directionsRenderer, updateMapRoute, startPolling, stopPolling]);

  // Adicionar detector de interação do usuário
  useEffect(() => {
    const handleInteraction = () => {
      document.documentElement.setAttribute('data-user-interacted', 'true');
      // Pré-carrega o áudio após interação
      if (audioRef.current) {
        audioRef.current.load();
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Verifica o status inicial e configura o polling
  useEffect(() => {
    let isMounted = true;

    const checkInitialStatus = async () => {
      try {
        const response = await api.get('/users/me');
        const isAvailable = response.data.isAvailable || false;
        
        if (isMounted) {
          setIsOnline(isAvailable);
          if (isAvailable) {
            startPolling();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status inicial:', error);
      }
    };

    checkInitialStatus();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Atualiza o polling quando o status online muda
  useEffect(() => {
    if (isOnline && !currentRide) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isOnline, currentRide, startPolling, stopPolling]);

  // Handler para alternar status online/offline
  const handleStatusToggle = async () => {
    try {
      const newStatus = !isOnline;
      console.log('Alterando status para:', newStatus);
      
      await api.patch('/users/availability', { isAvailable: newStatus });
      setIsOnline(newStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Modifique o useEffect de verificação de conexão
  useEffect(() => {
    let retryCount = 0;
    
    const checkConnection = async () => {
      try {
        console.log('Verificando conexão...');
        const response = await api.get('/users/me');
        console.log('Resposta recebida:', response.data);
        
        setIsConnected(true);
        setError('');
        retryCount = 0;
      } catch (error) {
        console.error('Erro completo:', error);
        
        // Erro de autenticação
        if (error.response?.status === 401) {
          setError('Sessão expirada. Por favor, faça login novamente.');
          // Aqui você pode redirecionar para a página de login
          return;
        }
        
        // Erro de conexão
        if (error.code === 'ERR_NETWORK') {
          setError('Não foi possível conectar ao servidor. Verificando conexão...');
        } else {
          setError(`Erro ao verificar conexão: ${error.response?.data?.message || error.message}`);
        }
        
        retryCount++;
        setIsConnected(false);
        
        if (retryCount >= MAX_RETRIES) {
          setIsOnline(false);
        }
      }
    };

    // Verifica imediatamente
    checkConnection();
    
    // Configura o intervalo
    const interval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Função para aceitar corrida
  const handleAcceptRide = async () => {
    if (!availableRide) return;

    try {
      console.log('Aceitando corrida:', availableRide._id);
      const response = await api.post(`/rides/accept/${availableRide._id}`);
      console.log('Resposta ao aceitar:', response.data);
      
      setCurrentRide(response.data);
      setRideStatus('accepted');
      setAvailableRide(null);
      stopPolling();
      
      // Atualiza o mapa com a rota até o passageiro
      updateMapRoute(response.data);
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      setError(error?.response?.data?.message || 'Erro ao aceitar corrida');
    }
  };

  // Função para iniciar corrida
  const handleStartRide = async () => {
    if (!currentRide) return;

    try {
      console.log('Iniciando corrida:', currentRide._id);
      setError('');
      const response = await api.post(`/rides/start/${currentRide._id}`);
      console.log('Resposta ao iniciar:', response.data);
      
      setCurrentRide(response.data);
      setRideStatus('in_progress');
      
      // Atualiza o mapa com a rota até o destino
      updateMapRoute(response.data, true);
    } catch (error) {
      console.error('Erro ao iniciar corrida:', error);
      setError(error?.response?.data?.message || 'Erro ao iniciar corrida');
    }
  };

  // Atualizar a função handleCompleteRide
  const handleCompleteRide = useCallback(async () => {
    if (!currentRide) return;

    try {
      await api.post(`/rides/complete/${currentRide._id}`);
      
      // Limpa todos os estados relacionados à corrida
      setCurrentRide(null);
      setRideStatus(null);
      setDirections(null);
      setAvailableRide(null);
      
      // Limpa o renderer do mapa
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        setDirectionsRenderer(null);
      }

      // Adiciona mensagem de sucesso
      setError('Corrida finalizada com sucesso!');
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);

      // Aguarda um momento antes de reiniciar o polling
      setTimeout(() => {
        if (isOnline) {
          startPolling();
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao finalizar corrida:', error);
      setError(error?.response?.data?.message || 'Erro ao finalizar corrida');
    }
  }, [currentRide, directionsRenderer, isOnline, startPolling]);

  // Função para recusar corrida
  const handleDeclineRide = () => {
    if (!availableRide) return;
    
    // Limpa os timers atuais
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    setDeclinedRideId(availableRide._id);
    setAvailableRide(null);

    setTimeout(() => {
      setDeclinedRideId(null);
    }, DECLINE_TIMEOUT);
  };

  // Adicione este componente para mostrar os detalhes da corrida atual
  const CurrentRideDetailsComponent = ({ ride, status, onComplete, onStart }) => {
    if (!ride) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-6 animate-slide-up z-30">
        <div className="max-w-xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            {status === 'accepted' ? 'A caminho do passageiro' : 'Corrida em andamento'}
          </h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Passageiro:</span> {ride.passenger.name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Telefone:</span> {ride.passenger.phone}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Local de Embarque:</span> {ride.origin.address}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Destino:</span> {ride.destination.address}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Distância</p>
                <p className="text-sm text-gray-900">{(ride.distance / 1000).toFixed(1)} km</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Tempo est.</p>
                <p className="text-sm text-gray-900">{Math.round(ride.duration / 60)} min</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Valor</p>
                <p className="text-lg font-semibold text-green-600">
                  R$ {ride.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <a
                href={`tel:${ride.passenger.phone}`}
                className="flex-1 bg-green-500 text-white py-4 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors text-center"
              >
                Ligar para Passageiro
              </a>
              
              {status === 'accepted' && (
                <button
                  onClick={onStart}
                  className="flex-1 bg-blue-500 text-white py-4 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Iniciar Corrida
                </button>
              )}

              {status === 'in_progress' && (
                <button
                  onClick={onComplete}
                  className="flex-1 bg-blue-500 text-white py-4 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Finalizar Corrida
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
      >
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={14}
            center={currentLocation || { lat: -23.550520, lng: -46.633308 }}
            onLoad={onMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            }}
          >
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
              />
            )}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>

          {/* Botão de status */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleStatusToggle}
              disabled={!isConnected}
              className={`px-4 py-2 rounded-lg font-medium ${
                !isConnected 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : isOnline 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              {!isConnected 
                ? 'Servidor Indisponível' 
                : isOnline 
                  ? 'Online' 
                  : 'Offline'}
            </button>
          </div>

          {/* Indicador de status do servidor */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-gray-700">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Corrida disponível */}
          {availableRide && !currentRide && (
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

          {/* Detalhes da corrida atual */}
          {currentRide && (
            <CurrentRideDetailsComponent 
              ride={currentRide}
              status={rideStatus}
              onComplete={handleCompleteRide}
              onStart={handleStartRide}
            />
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="absolute top-20 left-0 right-0 mx-4 z-40">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            </div>
          )}
        </div>
      </LoadScript>
    </div>
  );
} 