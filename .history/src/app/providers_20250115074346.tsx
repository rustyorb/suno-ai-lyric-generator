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
    modelPathInResponse: "",
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
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );
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

    // Basic validation for API key formats
    const keyFormats = {
      OpenAI: /^sk-(?:proj-)?[a-zA-Z0-9-_]{32,}$/,
      OpenRouter: /^sk-or-v1-[a-zA-Z0-9]{64}$/,
      Anthropic: /^sk-ant-api\d{2}-[a-zA-Z0-9-_]{48,}$/,
    };

    let isValidFormat = false;
    const regex = keyFormats[provider.name as keyof typeof keyFormats];

    if (regex) {
      isValidFormat = regex.test(apiKey);
      console.log(`🔍 Testing ${provider.name} key format:`, isValidFormat);
    } else {
      // For custom providers, just check if key exists and has reasonable length
      isValidFormat = apiKey.length >= 32;
      console.log(
        `🔍 Custom provider key length check (>= 32):`,
        isValidFormat
      );
    }

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
        headers["X-Title"] = "Suno AI Lyric Generator";
      }

      const response = await axios.get(provider.modelsEndpoint, { headers });

      let models: { id: string; name: string }[] = [];

      // Extract models based on provider-specific path
      if (provider.modelPathInResponse) {
        const data = provider.modelPathInResponse
          ? response.data[provider.modelPathInResponse]
          : response.data;

        models = data.map((model: any) => ({
          id: model[provider.modelIdPath || "id"],
          name: model[provider.modelNamePath || "name"],
        }));
      } else {
        // Fallback to direct mapping
        models = response.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id,
        }));
      }

      // Filter for modern chat models
      const filteredModels = models.filter((model) => {
        const modelId = model.id.toLowerCase();
        const modelName = model.name.toLowerCase();

        // Include specific model families
        return (
          modelId.includes("gpt-4") ||
          modelId.includes("gpt-3.5") ||
          modelId.includes("claude") ||
          modelId.includes("llama-2") ||
          modelId.includes("mixtral") ||
          modelId.includes("mistral") ||
          modelId.includes("gemini") ||
          // Include models explicitly marked as chat models
          modelId.includes("chat") ||
          modelName.includes("chat")
        );
      });

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
