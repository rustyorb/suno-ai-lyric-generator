"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAIProviders, getEnvVar } from "./providers";
import ProviderManager from "./components/ProviderManager";
import DraftLibrary from "./components/DraftLibrary";
import RhymeAnalyzer from "./components/RhymeAnalyzer";

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
  const [mood, setMood] = useState("Gritty");
  const [rhymeDensity, setRhymeDensity] = useState(5);
  const [profanityLevel, setProfanityLevel] = useState(5);
  const [systemPrompt, setSystemPrompt] = useState("");
  const PERSONA_TEMPLATES: Record<string, string> = {
    None: "",
    "Old-school Rapper":
      "Use a classic, old-school hip-hop style with storytelling elements.",
    "Trap Artist": "Use modern trap slang and rhythm patterns.",
    "Storytelling Poet": "Adopt a poetic narrative style with vivid imagery.",
  };
  const [persona, setPersona] = useState<string>("None");
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showProviderManager, setShowProviderManager] = useState(false);

  // Load system prompt from API
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await fetch('/api/system-prompt');
        const data = await res.json();
        if (data.prompt) {
          setSystemPrompt(data.prompt as string);
        }
      } catch (err) {
        console.error('Failed to load system prompt', err);
      }
    };
    fetchPrompt();
  }, []);

  // Load last used configuration on mount
  useEffect(() => {
    const init = async () => {
      const lastUsed = loadLastUsed();
      if (lastUsed) {
        const provider = providers.find(
          (p) => p.name === lastUsed.provider.name
        );
        if (provider) {
          setSelectedProvider(provider);
          const models = await fetchModels(provider);
          if (lastUsed.model) {
            const model = models.find((m) => m.id === lastUsed.model.id);
            if (model) {
              setSelectedModel(model);
            }
          }
        }
      }
    };
    init();
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
      const apiKey = getEnvVar(selectedProvider.apiKeyEnvVar);
      console.log("Using provider: " + selectedProvider.name);

      if (!apiKey) {
        throw new Error("No API key found for " + selectedProvider.name);
      }

      const requestBody = {
        model: selectedModel.id,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\n${PERSONA_TEMPLATES[persona]}`,
          },
          {
            role: "user",
            content:
              `Generate complete song lyrics about "${theme}" in a ${mood.toLowerCase()} mood. Use a rhyme density of ${rhymeDensity}/10 and a profanity level of ${profanityLevel}/10. Follow all formatting rules, structure requirements, and advanced techniques defined in the system prompt. Pay close attention to your flow and rhyme scheme. Make sure syllable counts are accurate. `,
          },
        ],
        temperature: 0.85,
        max_tokens: 4000,
      };

      const headers: Record<string, string> = {
        Authorization: (selectedProvider.authHeaderPrefix || "") + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
      };

      // Add OpenRouter specific headers
      if (selectedProvider.name === "OpenRouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "Suno AI Lyric Generator v2";
        headers["Content-Type"] = "application/json";
      }

      console.log("Making API request to:", selectedProvider.apiUrl);
      console.log("Request headers:", {
        ...headers,
        Authorization: "[REDACTED]",
      });
      console.log("Request body:", { ...requestBody, messages: "[REDACTED]" });

      const response = await axios.post(selectedProvider.apiUrl, requestBody, {
        headers,
        timeout: 90000, // 90 second timeout for generation
      });

      console.log("API Response status:", response.status);
      console.log("API Response headers:", response.headers);

      if (!response.data) {
        console.error("Empty API response");
        throw new Error("Empty response from API");
      }

      if (!response.data.choices?.[0]?.message?.content) {
        console.error("Invalid API response structure:", response.data);
        throw new Error("Invalid response structure from API");
      }

      const fullLyrics = response.data.choices[0].message.content.trim();

      if (!fullLyrics) {
        console.error("Empty lyrics in response");
        throw new Error("Empty lyrics response from API");
      }

      console.log("Successfully generated lyrics");

      setGeneratedLyrics(fullLyrics);
    } catch (error: unknown) {
      console.error("Error generating lyrics:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data;

        console.error("API Error details:", {
          status,
          data: responseData,
          message: error.message,
          headers: error.response?.headers,
        });

        if (status === 429) {
          setError(
            "Rate limit exceeded. Please wait a moment before trying again."
          );
        } else if (status === 401 || status === 403) {
          setError(
            "Authentication failed for " +
              selectedProvider.name +
              ". Please check your API key."
          );
        } else if (status === 404) {
          setError(
            "Model " + selectedModel.name + " not found or unavailable."
          );
        } else if (status === 400) {
          const errorMessage =
            responseData?.error?.message ||
            responseData?.error ||
            error.message;
          setError("Invalid request: " + errorMessage);
        } else if (status === 503) {
          setError(
            selectedProvider.name +
              " service is currently unavailable. Please try again later."
          );
        } else {
          const errorMessage =
            responseData?.error?.message ||
            responseData?.error ||
            error.message;
          setError("API Error: " + errorMessage + ". Please try again.");
        }
      } else if (error instanceof Error) {
        if (error.message.includes("Network Error")) {
          console.error("Network Error details:", error);
          setError(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          console.error("Unexpected Error:", error);
          setError("Error: " + error.message);
        }
      } else {
        console.error("Unknown Error:", error);
        setError("An unexpected error occurred. Please try again.");
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
                  onClick={() => {
                    const provider = providers.find((p) => p.name === "OpenAI");
                    if (provider) {
                      setSelectedProvider(provider);
                      setSelectedModel(null);
                      saveLastUsed(provider, null);
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
                {availableModels
                  .filter(
                    (model, index, self) =>
                      index ===
                      self.findIndex((m) => {
                        const getBaseModelName = (name: string): string => {
                          const parts = name.split(":")[0].split("/");
                          return parts.length === 2 ? parts[1] : name;
                        };
                        return (
                          getBaseModelName(m.name) ===
                          getBaseModelName(model.name)
                        );
                      })
                  )
                  .map((model) => {
                    // Clean up OpenRouter model names
                    let displayName = model.name;
                    if (selectedProvider?.name === "OpenRouter") {
                      // Extract the base model name without variations/descriptions
                      // Extract provider and model name
                      const parts = displayName.split(":")[0].split("/");
                      if (parts.length === 2) {
                        const [provider, modelName] = parts;
                        displayName = provider + ": " + modelName;
                      }
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

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded"
              >
                <option value="Gritty">Gritty</option>
                <option value="Reflective">Reflective</option>
                <option value="Energetic">Energetic</option>
                <option value="Smooth">Smooth</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Persona
              </label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded"
              >
                {Object.keys(PERSONA_TEMPLATES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rhyme Density: {rhymeDensity}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rhymeDensity}
                onChange={(e) => setRhymeDensity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Profanity Level: {profanityLevel}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={profanityLevel}
                onChange={(e) => setProfanityLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <button
            onClick={generateLyrics}
            disabled={isGenerating || !selectedProvider || !selectedModel}
            className={
              "w-full py-3 rounded-md transition-colors " +
              (isGenerating || !selectedProvider || !selectedModel
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800")
            }
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
              <RhymeAnalyzer lyrics={generatedLyrics} />
            </div>
          )}
          <DraftLibrary
            currentLyrics={generatedLyrics}
            onSelectDraft={(d) => setGeneratedLyrics(d.content)}
          />
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
