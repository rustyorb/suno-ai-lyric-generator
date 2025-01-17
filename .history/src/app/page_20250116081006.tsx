"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAIProviders } from "./providers";
import ProviderManager from "./components/ProviderManager";

// Load last used provider and model from localStorage
const loadLastUsed = () => {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("lastUsedAIConfig");
  return saved ? JSON.parse(saved) : null;
};

// Save last used provider and model to localStorage
const saveLastUsed = (provider: any, model: any) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("lastUsedAIConfig", JSON.stringify({ provider, model }));
};

export default function Home() {
  const {
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
  } = useAIProviders();

  const [theme, setTheme] = useState("");
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showProviderManager, setShowProviderManager] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Comprehensive debugging of environment variables and API configuration
  // Load last used configuration on mount
  useEffect(() => {
    const lastUsed = loadLastUsed();
    if (lastUsed) {
      const provider = providers.find((p) => p.name === lastUsed.provider.name);
      if (provider) {
        setSelectedProvider(provider);
        fetchModels(provider).then(() => {
          if (lastUsed.model) {
            const model = availableModels.find(
              (m) => m.id === lastUsed.model.id
            );
            if (model) {
              setSelectedModel(model);
            }
          }
        });
      }
    }
  }, [providers]); // Only run on mount and when providers change

  const generateLyrics = async () => {
    if (!theme.trim()) {
      setError("Please enter a theme");
      return;
    }

    if (!selectedProvider || !selectedModel) {
      setError("Please select an AI provider and model");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGeneratedLyrics("");

    try {
      // Access environment variables from window.ENV
      const OPENROUTER_API_KEY =
        (window as any).ENV?.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
      const OPENAI_API_KEY =
        (window as any).ENV?.NEXT_PUBLIC_OPENAI_API_KEY || "";

      // Select API key based on provider
      const apiKey =
        selectedProvider.name === "OpenRouter"
          ? OPENROUTER_API_KEY
          : selectedProvider.name === "OpenAI"
          ? OPENAI_API_KEY
          : "";

      if (!apiKey) {
        throw new Error(`No API key found for ${selectedProvider.name}`);
      }

      let fullLyrics = "";

      const requestBody = {
        model: selectedModel.id,
        messages: [
          {
            role: "system",
            content:
              "You are an elite hip-hop lyricist creating lyrics for Suno AI. Use strict Suno vocal tag formatting. Always enclose lyrics in the appropriate section tags as defined in the prompt. Use parentheses () for callback/adlib vocals. Maintain complex rhyme schemes and authentic street wisdom.",
          },
          {
            role: "user",
            content: `Generate complete song lyrics about "${theme}". Follow the structure and formatting defined in the system prompt.`,
          },
        ],
        temperature: 0.7,
      };

      const headers: Record<string, string> = {
        Authorization: `${selectedProvider.authHeaderPrefix || ""}${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
      };

      // Add OpenRouter specific headers
      if (selectedProvider.name === "OpenRouter") {
        headers["X-Title"] = "Suno AI Lyric Generator v2";
        headers["User-Agent"] = "Suno AI Lyric Generator/2.0.0";
        headers["X-Custom-Auth"] = "true";
      }

      const response = await axios.post(selectedProvider.apiUrl, requestBody, {
        headers,
      });

      fullLyrics = response.data.choices[0].message.content.trim();

      setGeneratedLyrics(fullLyrics);
    } catch (error: unknown) {
      console.error("🚨 Lyric Generation Error:", error);

      // Enhanced error handling with type checking
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data;

        // Handle rate limiting
        if (status === 429) {
          setError(
            "Rate limit exceeded. Please wait a moment before trying again."
          );
        }
        // Handle authentication errors
        else if (status === 401 || status === 403) {
          setError(
            `Authentication failed for ${selectedProvider.name}. Please check your API key.`
          );
        }
        // Handle model-specific errors
        else if (status === 404) {
          setError(`Model ${selectedModel.name} not found or unavailable.`);
        }
        // Handle validation errors
        else if (status === 400) {
          setError(`Invalid request: ${responseData?.error || error.message}`);
        }
        // Handle service unavailable
        else if (status === 503) {
          setError(
            `${selectedProvider.name} service is currently unavailable. Please try again later.`
          );
        }
        // Handle other API errors
        else {
          console.error("🚨 API Error Details:", {
            status,
            data: responseData,
            message: error.message,
          });
          setError(
            `API Error: ${
              responseData?.error || error.message
            }. Please try again.`
          );
        }
      }
      // Handle network errors
      else if (
        error instanceof Error &&
        error.message.includes("Network Error")
      ) {
        setError("Network error. Please check your internet connection.");
      }
      // Handle other errors
      else {
        setError(
          `Error: ${
            error instanceof Error
              ? error.message
              : "An unexpected error occurred"
          }`
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-500">
          Suno AI Lyric Generator
        </h1>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Provider
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const provider = providers.find(
                      (p) => p.name === "OpenRouter"
                    );
                    if (provider) {
                      setSelectedProvider(provider);
                      setSelectedModel(null);
                      saveLastUsed(provider, null);
                      fetchModels(provider);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                >
                  Use OpenRouter
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Button clicked: OpenAI");
                    console.log("Current providers:", providers);
                    const provider = providers.find((p) => p.name === "OpenAI");
                    console.log("Found provider:", provider);
                    if (provider) {
                      console.log("Setting provider:", provider.name);
                      setSelectedProvider(provider);
                      setSelectedModel(null);
                      // Force fetch models
                      fetchModels(provider);
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                >
                  Use OpenAI
                </button>
              </div>
              {selectedProvider && (
                <div className="mt-2 text-sm text-gray-300">
                  Selected: {selectedProvider.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model {isLoadingModels && "(Loading...)"}
              </label>
              {modelError && (
                <div className="text-red-500 text-sm mb-2">{modelError}</div>
              )}
              <select
                value={selectedModel?.id || ""}
                onChange={(e) => {
                  const model = availableModels.find(
                    (m) => m.id === e.target.value
                  );
                  setSelectedModel(model || null);
                  if (model && selectedProvider) {
                    saveLastUsed(selectedProvider, model);
                  }
                }}
                disabled={!selectedProvider || isLoadingModels}
                className="w-full bg-gray-700 text-white p-2 rounded disabled:opacity-50"
              >
                <option value="">Select Model</option>
                {availableModels.map((model) => {
                  // Clean up OpenRouter model names
                  let displayName = model.name;
                  if (selectedProvider?.name === "OpenRouter") {
                    // Remove long descriptions and keep just the model name
                    displayName = displayName
                      .split(".")[0] // Take first part before period
                      .split("(")[0] // Remove anything in parentheses
                      .split("launched")[0] // Remove "launched with..." descriptions
                      .trim();
                  }
                  return (
                    <option key={model.id} value={model.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Enter lyric theme (e.g., street life, love, struggle)"
            className="w-full p-3 bg-gray-700 text-white rounded-md mb-4 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={generateLyrics}
            disabled={isGenerating || !selectedProvider || !selectedModel}
            className={`w-full py-3 rounded-md transition-colors ${
              isGenerating || !selectedProvider || !selectedModel
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
            }`}
          >
            {isGenerating ? "Generating Lyrics..." : "Generate Lyrics"}
          </button>

          {error && (
            <div className="bg-red-900 text-red-300 p-3 rounded-md mt-4">
              {error}
            </div>
          )}

          {generatedLyrics && (
            <div className="mt-6 p-4 bg-gray-700 rounded-md">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">
                Generated Lyrics
              </h2>
              <pre className="whitespace-pre-wrap text-gray-300">
                {generatedLyrics}
              </pre>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setShowProviderManager(!showProviderManager)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white p-2 rounded mb-4"
          >
            {showProviderManager ? "Hide" : "Show"} Provider Manager
          </button>

          {showProviderManager && (
            <ProviderManager
              providers={providers}
              addProvider={addProvider}
              removeProvider={removeProvider}
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              isLoadingModels={isLoadingModels}
              modelError={modelError}
              fetchModels={fetchModels}
            />
          )}
        </div>
      </div>
    </main>
  );
}
