import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserSelect, setShowUserSelect] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Carregar lista de usuários
  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      // Filtra admin da lista
      const filteredUsers = response.data.filter(u => u.role !== 'admin');
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/support/conversations');
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Erro ao carregar conversas');
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await api.get(`/messages/support/user/${userId}`);
      setMessages(response.data);
      setSelectedUser(userId);
      setShowUserSelect(false);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens');
    }
  };

  useEffect(() => {
    loadConversations();
    loadUsers();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
      const interval = setInterval(() => loadMessages(selectedUser), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Rola para a última mensagem quando novas mensagens chegarem
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await api.post('/messages/support/reply', {
        userId: selectedUser,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      loadConversations(); // Atualiza a lista de conversas
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
    }
  };

  const handleNewChat = () => {
    setShowUserSelect(true);
    setSelectedUser(null);
    setMessages([]);
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow">
      {/* Lista de conversas */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Conversas</h2>
            <button
              onClick={handleNewChat}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Nova Conversa
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversations.map((conv) => (
            <button
              key={conv.userId}
              onClick={() => setSelectedUser(conv.userId)}
              className={`w-full p-4 text-left hover:bg-gray-50 border-b ${
                selectedUser === conv.userId ? 'bg-gray-100' : ''
              }`}
            >
              <div className="font-medium">{conv.userName}</div>
              <div className="text-sm text-gray-500 truncate">
                {conv.lastMessage}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {showUserSelect ? (
          <div className="p-4">
            <h3 className="font-semibold mb-4">Selecione um usuário</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => loadMessages(u._id)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border"
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        ) : selectedUser ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender._id === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.sender.name}
                    </p>
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  );
} 