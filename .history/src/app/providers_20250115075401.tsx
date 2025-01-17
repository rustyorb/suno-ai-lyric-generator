"use client";

import { useState, useEffect } from "react";
import axios from "axios";
// Access environment variables in client components
const getEnvVar = (key: string) => {
  if (typeof window !== "undefined") {
    // Access environment variables from window.ENV
    return (window as any).ENV?.[key] || "";
  }
  return "";
};

export interface AIProvider {
  name: string;
  apiUrl: string;
  apiKeyEnvVar: string;
  modelsEndpoint?: string;
  authHeaderPrefix?: string;
  modelPathInResponse?: string;
  modelNamePath?: string;
  modelIdPath?: string;
}

export const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    name: "OpenRouter",
    apiUrl: "https://api.openrouter.ai/api/v1/chat/completions",
    apiKeyEnvVar: "NEXT_PUBLIC_OPENROUTER_API_KEY",
    modelsEndpoint: "https://api.openrouter.ai/api/v1/models",
    authHeaderPrefix: "Bearer ",
    modelPathInResponse: "data",
    modelNamePath: "name",
    modelIdPath: "id",
  },
  {
    name: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKeyEnvVar: "NEXT_PUBLIC_OPENAI_API_KEY",
    modelsEndpoint: "https://api.openai.com/v1/models",
    authHeaderPrefix: "Bearer ",
    modelPathInResponse: "data",
    modelNamePath: "id",
    modelIdPath: "id",
  },
];

export function useAIProviders() {
  console.log(
    "Initializing useAIProviders with DEFAULT_PROVIDERS:",
    DEFAULT_PROVIDERS
  );
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );

  // Log whenever providers or selectedProvider changes
  useEffect(() => {
    console.log("Current providers:", providers);
    console.log("Selected provider:", selectedProvider);
  }, [providers, selectedProvider]);
  const [selectedModel, setSelectedModel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [availableModels, setAvailableModels] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Validate API key with enhanced logging
  const validateApiKey = (provider: AIProvider) => {
    console.log("🔑 Validating API key for provider:", provider.name);
    console.log("📝 Environment variable name:", provider.apiKeyEnvVar);

    const apiKey = getEnvVar(provider.apiKeyEnvVar);
    console.log("🔍 API key status:", apiKey ? "EXISTS" : "MISSING");

    if (!apiKey) {
      const error = `No API key found for ${provider.name}`;
      console.error("❌", error);
      setApiKeyError(error);
      return false;
    }

    // Skip key format validation and just check if key exists
    const isValidFormat = apiKey.length > 0;
    console.log(`🔍 API key exists:`, isValidFormat);

    console.log("✅ API key format valid:", isValidFormat);

    if (!isValidFormat) {
      const error = `Invalid API key format for ${provider.name}. Please check your API key format.`;
      console.error("❌", error);
      setApiKeyError(error);
      return false;
    }

    console.log("✅ API key validation successful");
    setApiKeyError(null);
    return true;
  };

  // Fetch models for a selected provider
  const fetchModels = async (provider: AIProvider) => {
    // First validate API key
    if (!validateApiKey(provider)) {
      return;
    }

    if (!provider.modelsEndpoint) {
      setModelError("No models endpoint defined for this provider");
      setAvailableModels([]);
      return;
    }

    setIsLoadingModels(true);
    setModelError(null);

    try {
      const apiKey = getEnvVar(provider.apiKeyEnvVar);

      const headers: Record<string, string> = {
        Authorization: `${provider.authHeaderPrefix || ""}${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
      };

      // Add OpenRouter specific headers
      if (provider.name === "OpenRouter") {
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "Suno AI Lyric Generator";
        headers["User-Agent"] = "Suno AI Lyric Generator/1.0.0";
      }

      const response = await axios.get(provider.modelsEndpoint, { headers });

      // For OpenAI, models are in response.data.data
      // For OpenRouter, models are directly in response.data
      const modelList =
        provider.name === "OpenAI" ? response.data.data : response.data;

      interface ApiModel {
        id: string;
        name?: string;
      }

      let models = modelList.map((model: ApiModel) => ({
        id: model.id,
        name: model.name || model.id,
      }));

      // Filter for chat completion models
      const filteredModels = models.filter(
        (model: { id: string; name: string }) => {
          const id = model.id.toLowerCase();
          return (
            // OpenAI models
            id.includes("gpt-4") ||
            id.includes("gpt-3.5-turbo") ||
            // OpenRouter models
            id.includes("claude") ||
            id.includes("mixtral") ||
            id.includes("llama") ||
            id.includes("mistral") ||
            id.includes("gemini")
          );
        }
      );

      setAvailableModels(filteredModels);
      setSelectedModel(null);
    } catch (error: unknown) {
      console.error("Error fetching models:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setModelError(`Failed to fetch models: ${errorMessage}`);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // When a provider is selected, fetch its models
  useEffect(() => {
    if (selectedProvider) {
      fetchModels(selectedProvider);
    }
  }, [selectedProvider]);

  const addProvider = (newProvider: AIProvider) => {
    const updatedProviders = [...providers, newProvider];
    setProviders(updatedProviders);

    // Store custom providers in local storage
    const customProviders = updatedProviders.filter(
      (p) => !DEFAULT_PROVIDERS.some((dp) => dp.name === p.name)
    );
    localStorage.setItem("aiProviders", JSON.stringify(customProviders));
  };

  const removeProvider = (providerName: string) => {
    const updatedProviders = providers.filter((p) => p.name !== providerName);
    setProviders(updatedProviders);

    // Update local storage
    const customProviders = updatedProviders.filter(
      (p) => !DEFAULT_PROVIDERS.some((dp) => dp.name === p.name)
    );
    localStorage.setItem("aiProviders", JSON.stringify(customProviders));
  };

  return {
    providers,
    selectedProvider,
    selectedModel,
    availableModels,
    isLoadingModels,
    modelError,
    apiKeyError,
    setSelectedProvider,
    setSelectedModel,
    addProvider,
    removeProvider,
    fetchModels,
  };
}
