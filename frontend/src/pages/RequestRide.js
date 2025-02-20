import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';

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
          } else {
            console.error('Erro ao calcular rota:', status);
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
      await api.post('/rides/request', {
        origin,
        destination
      });
      alert('Corrida solicitada com sucesso!');
    } catch (err) {
      setError('Erro ao solicitar corrida');
      console.error(err);
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
} 