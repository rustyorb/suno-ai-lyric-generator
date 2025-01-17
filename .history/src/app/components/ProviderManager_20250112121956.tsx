'use client'

interface Provider {
  name: string;
  apiUrl: string;
  authHeaderPrefix?: string;
}

interface ProviderManagerProps {
  providers: Provider[];
  addProvider: (provider: Provider) => void;
  removeProvider: (providerName: string) => void;
}

export default function ProviderManager({ providers, addProvider, removeProvider }: ProviderManagerProps) {
  const handleAddProvider = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const apiUrl = formData.get('apiUrl') as string;
    const authHeaderPrefix = formData.get('authHeaderPrefix') as string;

    if (name && apiUrl) {
      addProvider({
        name,
        apiUrl,
        authHeaderPrefix: authHeaderPrefix || '',
      });
      e.currentTarget.reset();
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-purple-400">Manage AI Providers</h3>
      
      <form onSubmit={handleAddProvider} className="mb-6">
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., OpenAI, OpenRouter"
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API URL
            </label>
            <input
              type="text"
              name="apiUrl"
              placeholder="e.g., https://api.openai.com/v1/chat/completions"
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Auth Header Prefix (optional)
            </label>
            <input
              type="text"
              name="authHeaderPrefix"
              placeholder="e.g., Bearer "
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
        >
          Add Provider
        </button>
      </form>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className="flex items-center justify-between bg-gray-700 p-3 rounded"
          >
            <div>
              <h4 className="font-medium text-purple-400">{provider.name}</h4>
              <p className="text-sm text-gray-400">{provider.apiUrl}</p>
            </div>
            <button
              onClick={() => removeProvider(provider.name)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
