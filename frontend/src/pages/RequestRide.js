import React, { useState, useRef, useEffect } from 'react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';

export default function RequestRide() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  useEffect(() => {
    // Inicializa o mapa
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

          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true
          });
        },
        () => {
          // Fallback para São Paulo se não conseguir localização
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: -23.550520, lng: -46.633308 },
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true
          });
        }
      );
    }
  }, []);

  // Atualiza rota quando origem ou destino mudam
  useEffect(() => {
    if (origin && destination && mapInstanceRef.current) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRendererRef.current.setDirections(result);
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
    <div className="flex flex-col h-screen">
      {/* Mapa */}
      <div ref={mapRef} className="flex-1 w-full h-2/3" />

      {/* Formulário */}
      <div className="bg-white shadow-lg rounded-t-3xl -mt-6 relative z-10 p-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Para onde vamos?
          </h1>

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
      </div>
    </div>
  );
} 