import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';
import RideStatus from '../components/RideStatus';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAVe7W-B0zZa-6ePrcLfZkDzs1RGRSHSCc';

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

  useEffect(() => {
    // Pega localização atual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setOrigin(location); // Define a localização atual como origem
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter sua localização');
        }
      );
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin || !destination) {
      setError('Por favor, selecione origem e destino');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/rides/request', {
        origin,
        destination,
        distance,
        duration
      });

      setCurrentRide(response.data.ride);
    } catch (err) {
      setError('Erro ao solicitar corrida');
      console.error(err);
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
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">
          Solicitar Corrida
        </h1>

        <div className="mt-6">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={14}
              center={currentLocation || { lat: -23.550520, lng: -46.633308 }}
            >
              {currentLocation && <Marker position={currentLocation} />}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>

            <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
          </LoadScript>
        </div>

        {currentRide && (
          <RideStatus 
            ride={currentRide} 
            onCancel={handleCancelRide}
          />
        )}
      </div>
    </div>
  );
} 