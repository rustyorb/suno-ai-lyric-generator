"use client";

import { useState } from "react";
import { AIProvider } from "../providers";

interface ProviderManagerProps {
  providers: AIProvider[];
  addProvider: (provider: AIProvider) => void;
  removeProvider: (providerName: string) => void;
  selectedProvider: AIProvider | null;
  selectedModel: { id: string; name: string } | null;
  isLoadingModels: boolean;
  modelError: string | null;
  fetchModels: (provider: AIProvider) => void;
}

export default function ProviderManager({
  providers,
  addProviderAction,
  removeProviderAction,
  selectedProvider,
  selectedModel,
  isLoadingModels,
  modelError,
  fetchModelsAction,
}: ProviderManagerProps) {
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(
    null
  );

  const handleAddProvider = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const apiUrl = formData.get("apiUrl") as string;
    const authHeaderPrefix = formData.get("authHeaderPrefix") as string;
    const modelsEndpoint = formData.get("modelsEndpoint") as string;

    if (name && apiUrl) {
      addProviderAction({
        name,
        apiUrl,
        apiKeyEnvVar: `NEXT_PUBLIC_${name
          .toUpperCase()
          .replace(/\s+/g, "_")}_API_KEY`,
        authHeaderPrefix: authHeaderPrefix || "",
        modelsEndpoint:
          modelsEndpoint || `${apiUrl.replace("/chat/completions", "")}/models`,
        modelPathInResponse: "",
        modelNamePath: "id",
        modelIdPath: "id",
      });
      e.currentTarget.reset();
    }
  };

  const handleEditProvider = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProvider) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const apiUrl = formData.get("apiUrl") as string;
    const authHeaderPrefix = formData.get("authHeaderPrefix") as string;
    const modelsEndpoint = formData.get("modelsEndpoint") as string;

    // Remove old provider
    removeProviderAction(editingProvider.name);

    // Add updated provider
    addProvider({
      name,
      apiUrl,
      apiKeyEnvVar: editingProvider.apiKeyEnvVar, // Keep original env var name
      authHeaderPrefix: authHeaderPrefix || "",
      modelsEndpoint:
        modelsEndpoint || `${apiUrl.replace("/chat/completions", "")}/models`,
      modelPathInResponse: editingProvider.modelPathInResponse,
      modelNamePath: editingProvider.modelNamePath,
      modelIdPath: editingProvider.modelIdPath,
    });

    setEditingProvider(null);
  };

  const ProviderForm = ({
    provider,
    onSubmit,
  }: {
    provider?: AIProvider;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Provider Name
          </label>
          <input
            type="text"
            name="name"
            defaultValue={provider?.name}
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
            defaultValue={provider?.apiUrl}
            placeholder="e.g., https://api.openai.com/v1/chat/completions"
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Models Endpoint
          </label>
          <input
            type="text"
            name="modelsEndpoint"
            defaultValue={provider?.modelsEndpoint}
            placeholder="e.g., https://api.openai.com/v1/models"
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Auth Header Prefix
          </label>
          <input
            type="text"
            name="authHeaderPrefix"
            defaultValue={provider?.authHeaderPrefix}
            placeholder="e.g., Bearer "
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
      >
        {provider ? "Update Provider" : "Add Provider"}
      </button>
    </form>
  );

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-purple-400">
        Manage AI Providers
      </h3>

      {!editingProvider && <ProviderForm onSubmit={handleAddProvider} />}
      {editingProvider && (
        <>
          <h4 className="text-lg font-medium text-purple-400 mb-3">
            Edit Provider
          </h4>
          <ProviderForm
            provider={editingProvider}
            onSubmit={handleEditProvider}
          />
          <button
            onClick={() => setEditingProvider(null)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white p-2 rounded mb-4"
          >
            Cancel Edit
          </button>
        </>
      )}

      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider.name} className="bg-gray-700 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-purple-400">{provider.name}</h4>
              <div className="space-x-2">
                <button
                  onClick={() => fetchModelsAction(provider)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Refresh Models
                </button>
                <button
                  onClick={() => setEditingProvider(provider)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeProvider(provider.name)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <p>API URL: {provider.apiUrl}</p>
              <p>Models Endpoint: {provider.modelsEndpoint}</p>
              <p>API Key Env: {provider.apiKeyEnvVar}</p>
              {provider.name === selectedProvider?.name && (
                <div className="mt-2 p-2 bg-gray-800 rounded">
                  <p className="text-purple-400">Status:</p>
                  {isLoadingModels && <p>Loading models...</p>}
                  {modelError && <p className="text-red-400">{modelError}</p>}
                  {selectedModel && (
                    <p className="text-green-400">
                      Selected Model: {selectedModel.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
