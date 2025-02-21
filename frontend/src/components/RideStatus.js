import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function RideStatus({ ride, onCancel }) {
  const [currentRide, setCurrentRide] = useState(ride);
  const [error, setError] = useState('');

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/rides/status/${ride._id}`);
        setCurrentRide(response.data);
        
        // Se a corrida foi aceita, para o polling
        if (response.data.status !== 'pending') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        setError('Erro ao atualizar status da corrida');
        console.error(err);
      }
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(pollInterval);
  }, [ride._id]);

  const getStatusMessage = () => {
    switch (currentRide.status) {
      case 'pending':
        return 'Procurando motorista...';
      case 'accepted':
        return 'Motorista a caminho!';
      case 'in_progress':
        return 'Em viagem';
      case 'completed':
        return 'Corrida finalizada';
      case 'cancelled':
        return 'Corrida cancelada';
      default:
        return 'Status desconhecido';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {getStatusMessage()}
          </h3>
          {currentRide.status === 'pending' && (
            <button
              onClick={onCancel}
              className="text-red-600 hover:text-red-800"
            >
              Cancelar
            </button>
          )}
        </div>

        {currentRide.driver && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500">Seu motorista</h4>
            <div className="mt-2 flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {currentRide.driver.name}
                </p>
                <p className="text-sm text-gray-500">
                  {currentRide.driver.vehicle.model} - {currentRide.driver.vehicle.plate}
                </p>
              </div>
              <a
                href={`tel:${currentRide.driver.phone}`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Ligar
              </a>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 