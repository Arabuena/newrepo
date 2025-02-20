import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [driversResponse, statsResponse] = await Promise.all([
        api.get('/admin/pending-drivers'),
        api.get('/admin/stats')
      ]);
      
      setPendingDrivers(driversResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driverId) => {
    try {
      await api.post(`/admin/approve-driver/${driverId}`);
      fetchData(); // Recarrega os dados
      alert('Motorista aprovado com sucesso!');
    } catch (err) {
      setError('Erro ao aprovar motorista');
      console.error(err);
    }
  };

  const handleReject = async (driverId) => {
    if (!window.confirm('Tem certeza que deseja rejeitar este motorista?')) {
      return;
    }

    try {
      await api.post(`/admin/reject-driver/${driverId}`);
      fetchData(); // Recarrega os dados
      alert('Motorista rejeitado com sucesso!');
    } catch (err) {
      setError('Erro ao rejeitar motorista');
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">
          Painel Administrativo
        </h1>
        
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {/* Estatísticas */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Motoristas Ativos
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.activeDrivers}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Motoristas Pendentes
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.pendingDrivers}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total de Passageiros
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.totalPassengers}
                </dd>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Motoristas Pendentes */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Motoristas Pendentes ({pendingDrivers.length})
          </h2>

          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
            {pendingDrivers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {pendingDrivers.map((driver) => (
                  <li key={driver._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {driver.name}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">{driver.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Telefone</p>
                            <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Veículo</p>
                            <p className="text-sm font-medium text-gray-900">
                              {driver.vehicle.model} - {driver.vehicle.plate}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Documentos</p>
                            <p className="text-sm font-medium text-gray-900">
                              CNH: {driver.documents.cnh}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(driver._id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(driver._id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 text-center text-gray-500">
                Nenhum motorista pendente de aprovação
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 