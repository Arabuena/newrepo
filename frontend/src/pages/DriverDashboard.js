import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await api.get('/rides/driver');
        setRides(response.data);
      } catch (err) {
        setError('Erro ao carregar corridas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard do Motorista
        </h1>
        
        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Suas Corridas
              </h2>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : rides.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhuma corrida encontrada
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {rides.map((ride) => (
                  <li key={ride._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          De: {ride.origin.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          Para: {ride.destination.address}
                        </p>
                      </div>
                      <div>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          R$ {ride.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 