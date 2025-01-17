"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import getConfig from "next/config";

const getEnvVar = (key: string): string => {
  if (typeof window !== "undefined") {
    const windowEnv = (window as any).ENV?.[key];
    if (windowEnv) {
      console.log(`Found ${key} in window.ENV`);
      return windowEnv;
    }

    const { publicRuntimeConfig } = getConfig();
    const configValue = publicRuntimeConfig?.[key];
    console.log(
      `Falling back to publicRuntimeConfig for ${key}:`,
      configValue ? "SET" : "NOT SET"
    );
    return configValue || "";
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

export interface AIModel {
  id: string;
  name: string;
}

export const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    name: "OpenRouter",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKeyEnvVar: "NEXT_PUBLIC_OPENROUTER_API_KEY",
    modelsEndpoint: "https://openrouter.ai/api/v1/models",
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

interface UseAIProvidersReturn {
  providers: AIProvider[];
  selectedProvider: AIProvider | null;
  selectedModel: AIModel | null;
  availableModels: AIModel[];
  isLoadingModels: boolean;
  modelError: string | null;
  apiKeyError: string | null;
  setSelectedProvider: (provider: AIProvider | null) => void;
  setSelectedModel: (model: AIModel | null) => void;
  addProvider: (provider: AIProvider) => void;
  removeProvider: (providerName: string) => void;
  fetchModels: (provider: AIProvider) => Promise<void>;
}

export function useAIProviders(): UseAIProvidersReturn {
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Current providers:", providers);
    console.log("Selected provider:", selectedProvider);
  }, [providers, selectedProvider]);

  const validateApiKey = (provider: AIProvider): boolean => {
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

    const isValidFormat = apiKey.length > 0;
    console.log("✅ API key format valid:", isValidFormat);

    if (!isValidFormat) {
      const error = `Invalid API key format for ${provider.name}. Please check your API key format.`;
      console.error("❌", error);
      setApiKeyError(error);
      return false;
    }

    setApiKeyError(null);
    return true;
  };

  const fetchModels = async (provider: AIProvider): Promise<void> => {
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
        "HTTP-Referer": "http://localhost:3000",
      };

      if (provider.name === "OpenRouter") {
        headers["X-Title"] = "Suno AI Lyric Generator v2";
      }

      const response = await axios.get(provider.modelsEndpoint, {
        headers,
        timeout: 10000,
      });

      if (!response.data) {
        throw new Error("Empty response from API");
      }

      let apiModels = response.data.data || [];

      if (!Array.isArray(apiModels)) {
        throw new Error("Invalid response format: models list is not an array");
      }

      const processedModels = apiModels.map((model: any) => {
        let displayName = model.name || model.id;

        if (provider.name === "OpenRouter" && model.description) {
          const desc = model.description;
          if (desc.includes("is")) {
            displayName = desc.split(" is ")[0].trim();
          } else if (desc.includes(":")) {
            displayName = desc.split(":")[0].trim();
          } else {
            const words = desc.split(" ");
            displayName =
              words[0].toLowerCase() === "the"
                ? words.slice(1, 4).join(" ")
                : words.slice(0, 3).join(" ");
          }
        }

        return {
          id: model.id,
          name: displayName,
        };
      });

      // For OpenRouter, don't filter models as they're all chat-capable
      const filteredModels =
        provider.name === "OpenRouter"
          ? processedModels
          : processedModels.filter((model) => {
              const id = model.id.toLowerCase();
              return (
                id.includes("gpt-4") ||
                id.includes("gpt-3.5-turbo") ||
                id.includes("chat") ||
                id.includes("completion")
              );
            });

      setAvailableModels(filteredModels);
      setSelectedModel(null);
    } catch (error) {
      console.error("Error fetching models:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setModelError(`Failed to fetch models: ${errorMessage}`);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const addProvider = (newProvider: AIProvider) => {
    setProviders([...providers, newProvider]);
  };

  const removeProvider = (providerName: string) => {
    setProviders(providers.filter((p) => p.name !== providerName));
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
