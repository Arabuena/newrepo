import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const { unreadMessages, markMessagesAsRead } = useMessages();

  // Adiciona log para debug
  useEffect(() => {
    console.log('Estado de mensagens não lidas no Navbar:', unreadMessages);
  }, [unreadMessages]);

  // Verifica se está em uma corrida ativa
  const isInRide = location.pathname.includes('/rides/') || 
                   location.pathname === '/request-ride' || 
                   location.pathname === '/driver-dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHelpClick = () => {
    console.log('Menu de ajuda clicado, estado atual:', unreadMessages);
    setShowHelp(!showHelp);
    if (unreadMessages) {
      markMessagesAsRead();
    }
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">
              Leva
            </Link>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Painel Admin
                  </Link>
                ) : user.role === 'driver' ? (
                  <Link 
                    to="/driver-dashboard" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/request-ride" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Solicitar Corrida
                  </Link>
                )}
                
                {/* Container para o botão e dropdown de ajuda */}
                <div className="relative">
                  <button
                    onClick={handleHelpClick}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <div className="relative">
                      <svg 
                        className="w-5 h-5 mr-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      {unreadMessages && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    Ajuda
                  </button>

                  {/* Menu dropdown de ajuda */}
                  {showHelp && (
                    <div 
                      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-xl py-1 z-50 border border-gray-200"
                    >
                      {isInRide && (
                        <Link
                          to="/help/ride"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowHelp(false)}
                        >
                          Ajuda com a corrida
                        </Link>
                      )}
                      <Link
                        to="/help/support"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowHelp(false)}
                      >
                        Suporte
                      </Link>
                    </div>
                  )}
                </div>

                {user.role === 'admin' && (
                  <Link 
                    to="/admin/support" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Central de Suporte
                  </Link>
                )}

                <span className="text-gray-300 text-sm">
                  {user.name}
                </span>
                
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Entrar
                </Link>
                <div className="relative group">
                  <button 
                    className="bg-indigo-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600"
                  >
                    Cadastrar
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                    <Link
                      to="/register/passenger"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Como Passageiro
                    </Link>
                    <Link
                      to="/register/driver"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Como Motorista
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 