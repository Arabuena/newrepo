import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';
import RideStatus from '../components/RideStatus';
import { useNavigate } from 'react-router-dom';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

export default function RequestRide() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [price, setPrice] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const navigate = useNavigate();
  const mapRef = useRef(null);

  // Defina renderMarker usando useCallback antes de usá-lo
  const renderMarker = useCallback((position) => {
    if (!position || !window.google || !mapRef.current) return null;

    return new window.google.maps.marker.AdvancedMarkerElement({
      position,
      title: "Sua localização",
      map: mapRef.current
    });
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    if (currentLocation) {
      renderMarker(currentLocation);
    }
  }, [currentLocation, renderMarker]);

  useEffect(() => {
    let marker = null;

    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setOrigin(location);

          if (marker) {
            marker.setMap(null);
          }
          marker = renderMarker(location);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter sua localização');
        }
      );
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [renderMarker]);

  // Busca a corrida ativa ao carregar a página
  useEffect(() => {
    const fetchCurrentRide = async () => {
      try {
        const response = await api.get('/rides/current');
        if (response.data) {
          setCurrentRide(response.data);
          
          // Se tiver uma corrida ativa, busca as direções
          if (response.data.status !== 'completed' && response.data.status !== 'cancelled') {
            const directionsService = new window.google.maps.DirectionsService();
            
            const origin = {
              lat: response.data.origin.coordinates[1],
              lng: response.data.origin.coordinates[0]
            };
            
            const destination = {
              lat: response.data.destination.coordinates[1],
              lng: response.data.destination.coordinates[0]
            };

            const result = await directionsService.route({
              origin,
              destination,
              travelMode: window.google.maps.TravelMode.DRIVING
            });

            setDirections(result);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar corrida atual:', error);
        setError('Erro ao buscar corrida atual');
      }
    };

    fetchCurrentRide();
  }, []);

  // Atualiza rota quando origem ou destino mudam
  useEffect(() => {
    if (origin && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
            
            // Pega distância e duração
            const route = result.routes[0];
            const leg = route.legs[0];
            setDistance(leg.distance.value); // metros
            setDuration(leg.duration.value); // segundos

            // Calcula preço estimado
            const basePrice = 2;
            const pricePerKm = 2;
            const pricePerMin = 0.25;
            
            const distancePrice = (leg.distance.value / 1000) * pricePerKm;
            const durationPrice = (leg.duration.value / 60) * pricePerMin;
            const totalPrice = basePrice + distancePrice + durationPrice;
            
            setPrice(Math.round(totalPrice * 100) / 100);
          } else {
            console.error('Erro ao calcular rota:', status);
            setError('Erro ao calcular rota');
          }
        }
      );
    }
  }, [origin, destination]);

  const handleRequestRide = async (e) => {
    e.preventDefault();
    
    try {
      if (!origin || !destination) {
        setError('Selecione origem e destino');
        return;
      }

      setLoading(true);
      setError('');

      const rideData = {
        origin: {
          coordinates: [origin.lng, origin.lat],
          address: origin.formatted_address || origin.name
        },
        destination: {
          coordinates: [destination.lng, destination.lat],
          address: destination.formatted_address || destination.name
        },
        distance,
        duration,
        price
      };

      console.log('Enviando solicitação:', rideData);

      const response = await api.post('/rides', rideData);
      console.log('Corrida criada:', response.data);

      // Redireciona para a página de acompanhamento
      navigate(`/rides/${response.data._id}`);
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      setError(error.response?.data?.message || 'Erro ao solicitar corrida');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      await api.post(`/rides/cancel/${currentRide._id}`);
      setCurrentRide(null);
    } catch (err) {
      setError('Erro ao cancelar corrida');
      console.error(err);
    }
  };

  return (
    <div className="h-full">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={GOOGLE_MAPS_LIBRARIES}>
        <div className="h-full relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={currentLocation || { lat: -16.6799, lng: -49.2556 }}
            zoom={13}
            onLoad={onMapLoad}
          >
            {/* Renderiza as direções se existirem */}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>

          {/* Formulário e outros componentes */}
          <div className="absolute top-4 left-4 right-4 max-w-md mx-auto">
            {currentRide ? (
              <RideStatus 
                ride={currentRide} 
                onCancel={handleCancelRide}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Solicitar Corrida
                </h1>

                <div className="mt-6">
                  <form onSubmit={handleRequestRide} className="space-y-4">
                    <div>
                      <AddressAutocomplete
                        placeholder="Origem"
                        onSelect={setOrigin}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <AddressAutocomplete
                        placeholder="Destino"
                        onSelect={setDestination}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {price && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900">Detalhes da viagem</h3>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Distância</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {(distance / 1000).toFixed(1)} km
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Tempo estimado</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {Math.round(duration / 60)} min
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Preço estimado</dt>
                            <dd className="mt-1 text-2xl font-semibold text-gray-900">
                              R$ {price.toFixed(2)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}

                    {error && (
                      <div className="text-red-500 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !origin || !destination}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Solicitando...' : 'Solicitar Corrida'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </LoadScript>
    </div>
  );
} 