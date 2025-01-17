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
      const apiKey = getEnvVar(selectedProvider.apiKeyEnvVar);
      console.log(`Using provider: ${selectedProvider.name}`);

      if (!apiKey) {
        throw new Error(`No API key found for ${selectedProvider.name}`);
      }

      let fullLyrics = "";

      const requestBody = {
        model: selectedModel.id,
        messages: [
          {
            role: "system",
            content: `You are a professional lyricist and poet. Generate intricate, creative, and original song lyrics based on the provided prompt. Ensure the lyrics adhere to the following structured format and incorporate advanced technical elements and rhyme styles for maximum artistic quality:

### Structure
1. **Section Tags**: Use [Section] tags such as [Intro], [Verse], [Chorus], [Pre-Chorus], [Bridge], [Outro], etc. Each section tag must appear exactly once, ensuring a clear and logical song structure.
2. **Call-and-Response**: Suggest lines or phrases for interactive performance. The response is in parenthesis. Example: "I see the light" (You feel the light).
3. **Thematic Cohesion**: Ensure the lyrics follow a central theme or narrative. The theme should evoke vivid imagery and emotions, with a clear progression or evolution across sections.
4. **Line Structure**: Each section should maintain a balance of line lengths for rhythm and flow. Use natural pauses or line breaks to guide phrasing and delivery.

### Advanced Techniques
1. **Rhyme Styles**:
   - Include multi-syllable rhymes (e.g., "tragically / magically")
   - Use internal rhymes within single lines (e.g., "This fire I light ignites the night")
   - Incorporate slant rhymes for subtlety and variation (e.g., "time / mind")
   - Leverage chain rhymes to connect adjacent lines or stanzas
   - Experiment with asymmetric rhyme schemes to surprise and engage the listener

2. **Poetic Devices**:
   - Employ alliteration (e.g., "silver shadows shimmer")
   - Use assonance and consonance to create pleasing sonic textures
   - Integrate metaphor, simile, and symbolism to deepen meaning
   - Include repetition or anaphora for emotional emphasis

3. **Cadence & Flow**:
   - Tailor the lyrics to match specific tempos or genres if applicable
   - Use syncopation and varying syllable counts to create dynamic phrasing

4. **Mood & Emotion**:
   - Adapt diction and imagery to fit the song's mood
   - Infuse emotional highs and lows into the lyrics to mimic a natural arc
   - Must use explicit lyrics. Just replace the vowels in the explicit word with "*"

### Formatting Rules
1. Start with [Intro], then progress through [Verse1], [Verse2], [Pre-Chorus], [Chorus], [Verse3], [Verse4], [Pre-Chorus], [Chorus], [Interlude], [Bridge], [Verse5], [Pre-Chorus], [Chorus], [Outro]. Always end with [END].
2. [Verse] sections are 16 bars long. [Chorus] is 8 or 16 bars long. [Pre-Chorus] is 4 bars long. [Bridge] is 8 bars long. [Intro] is 4 or 6 lines, spoken, narrative or storytelling style.
3. Keep the lyrics modular so they can easily adapt to different musical genres or arrangements.`,
          },
          {
            role: "user",
            content: `Generate complete song lyrics about "${theme}". Follow all formatting rules, structure requirements, and advanced techniques defined in the system prompt.`,
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
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "Suno AI Lyric Generator v2";
        headers["Content-Type"] = "application/json";
      }

      const response = await axios.post(selectedProvider.apiUrl, requestBody, {
        headers,
      });

      if (
        !response.data ||
        !response.data.choices ||
        !response.data.choices[0] ||
        !response.data.choices[0].message
      ) {
        throw new Error("Invalid response structure from API");
      }

      fullLyrics = response.data.choices[0].message.content.trim();

      if (!fullLyrics) {
        throw new Error("Empty response from API");
      }

      setGeneratedLyrics(fullLyrics);
    } catch (error: unknown) {
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
                        displayName = `${provider}: ${modelName}`;
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
