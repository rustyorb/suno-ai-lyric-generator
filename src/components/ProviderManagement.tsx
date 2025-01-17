import React, { useState, useEffect } from 'react';
import { aiProviderService, AIProvider, AIModel } from '../services/aiProviders';

export function ProviderManagement() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [newProvider, setNewProvider] = useState({
    id: '',
    name: '',
    apiKey: '',
    baseURL: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Available provider types
  const providerTypes = [
    { name: 'OpenAI', defaultURL: 'https://api.openai.com/v1' },
    { name: 'Anthropic', defaultURL: 'https://api.anthropic.com/v1' },
    { name: 'OpenRouter', defaultURL: 'https://openrouter.ai/api/v1' }
  ];

  useEffect(() => {
    // Load existing providers on component mount
    const existingProviders = aiProviderService.getProviders();
    setProviders(existingProviders);
  }, []);

  const handleProviderSelect = (providerType: string) => {
    const selectedProvider = providerTypes.find(p => p.name === providerType);
    setNewProvider(prev => ({
      ...prev, 
      name: providerType,
      baseURL: selectedProvider?.defaultURL || '',
      id: `${providerType.toLowerCase()}_${Date.now()}` // Generate unique ID
    }));
  };

  const handleAddProvider = async () => {
    // Reset previous messages
    setError(null);
    setSuccess(null);

    // Validate inputs
    if (!newProvider.name || !newProvider.apiKey) {
      setError('Please select a provider and enter an API key');
      return;
    }

    try {
      // Attempt to add provider
      const addedProvider = await aiProviderService.addProvider(newProvider);
      
      // Update providers list
      setProviders(prev => [...prev, addedProvider]);
      
      // Show success message
      setSuccess(`${newProvider.name} provider added successfully`);
      
      // Reset form
      setNewProvider({
        id: '',
        name: '',
        apiKey: '',
        baseURL: ''
      });
    } catch (err) {
      // Handle and display any errors
      setError(err instanceof Error ? err.message : 'Failed to add provider');
    }
  };

  const handleTestConnection = async (provider: AIProvider) => {
    setIsTestingConnection(true);
    try {
      const isConnected = await aiProviderService.testProviderConnection(provider);
      if (isConnected) {
        setSuccess(`${provider.name} connection successful!`);
      } else {
        setError(`Failed to connect to ${provider.name}. Please check your credentials.`);
      }
    } catch (err) {
      setError(`Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const renderProviderModels = (provider: AIProvider) => {
    return (
      <div className="mt-2 p-2 bg-gray-100 rounded">
        <h4 className="font-semibold">Available Models:</h4>
        {provider.models.map(model => (
          <div key={model.id} className="text-sm">
            {model.name} ({model.id})
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">AI Provider Configuration</h2>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          {success}
        </div>
      )}

      {/* Provider Selection */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Provider
        </label>
        <div className="flex space-x-2">
          {providerTypes.map(provider => (
            <button
              key={provider.name}
              onClick={() => handleProviderSelect(provider.name)}
              className={`px-4 py-2 rounded ${
                newProvider.name === provider.name 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {provider.name}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Configuration Form */}
      {newProvider.name && (
        <div className="mt-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              API Key for {newProvider.name}
            </label>
            <input
              type="text"
              value={newProvider.apiKey}
              onChange={(e) => setNewProvider(prev => ({...prev, apiKey: e.target.value}))}
              placeholder="Enter your API key"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Base URL (optional)
            </label>
            <input
              type="text"
              value={newProvider.baseURL}
              onChange={(e) => setNewProvider(prev => ({...prev, baseURL: e.target.value}))}
              placeholder="Default URL will be used if left blank"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <button
            onClick={handleAddProvider}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Provider
          </button>
        </div>
      )}

      {/* Existing Providers */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Configured Providers</h3>
        {providers.length === 0 ? (
          <p className="text-gray-500">No providers configured yet</p>
        ) : (
          providers.map(provider => (
            <div key={provider.id} className="border rounded p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">{provider.name}</h4>
                <button
                  onClick={() => handleTestConnection(provider)}
                  disabled={isTestingConnection}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              {renderProviderModels(provider)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}