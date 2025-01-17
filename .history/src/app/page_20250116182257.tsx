"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAIProviders, getEnvVar } from "./providers";
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

      const requestBody = {
        model: selectedModel.id,
        messages: [
          {
            role: "system",
            content: `You are a master lyricist and poet specializing in hip-hop and rap. Generate intricate, creative, and original song lyrics based on the provided prompt. Ensure the lyrics adhere to the following structured format and incorporate advanced technical elements and rhyme styles for maximum artistic quality. Pay special attention to creating a dynamic flow with varied cadences, syncopation, and rhythmic patterns suitable for hip-hop.

### Structure
1. **Section Tags**: Use \[Section] tags such as \[Intro], \[Verse], \[Chorus], \[Pre-Chorus], \[Bridge], \[Outro], etc. Each section tag must appear exactly once, ensuring a clear and logical song structure.
2. **Call-and-Response**: Suggest lines or phrases for interactive performance, mimicking classic hip-hop techniques. The response is in parenthesis. Example: "I spit the truth" (They hear the truth).
3. **Thematic Cohesion**: Ensure the lyrics follow a central theme or narrative. The theme should evoke vivid imagery and emotions, with a clear progression or evolution across sections, telling a compelling story.
4. **Line Structure**: Each section should maintain a balance of line lengths for rhythm and flow. Use natural pauses or line breaks to guide phrasing and delivery, creating a rhythmic bounce characteristic of hip-hop.

### Advanced Techniques
 
  1. **Rhyme Styles**:

    *   Include **multi-syllable rhymes** (e.g., "revolution / retribution").
    *   Incorporate **complex internal rhymes** within single lines, a hallmark of advanced rap (e.g., "I'm in the zone, unknown, I've grown to the throne").
    *   Utilize **slant rhymes** for subtlety and variation (e.g., "prove / move").
    *   Employ **chain rhymes** to connect adjacent lines or stanzas, creating a continuous flow.
    *   Experiment with **asymmetric rhyme schemes** to surprise and engage the listener, reflecting the innovative nature of hip-hop.

2. **Poetic Devices**:

    *   Employ **alliteration** to enhance rhythm and flow (e.g., "lyrical legend, living large").
    *   Use **assonance** and **consonance** to create pleasing sonic textures unique to rap.
    *   Integrate **metaphor**, **simile**, and **symbolism** to deepen meaning and paint vivid pictures.
    *   Include **repetition**, **anaphora**, or **polysyndeton** for emotional emphasis, a staple in powerful rap verses (e.g., "I rise, I grind, I shine, I climb").

3. **Cadence & Flow**:

    *   Tailor the lyrics to match the rhythmic complexity of hip-hop using a mix of short, punchy lines and longer, intricate phrases.
    *   Intentionally use **syncopation** and off-beat phrasing, varying syllable counts to create dynamic, unpredictable flows that are the essence of rap.
    *   Incorporate **polyrhythms** where appropriate, layering different rhythmic patterns within the lyrics.

4. **Mood & Emotion**:

    *   Adapt diction and imagery to fit the song's mood—whether it's gritty and raw, smooth and reflective, or energetic and boastful.
    *   Infuse emotional highs and lows into the lyrics to mimic a natural arc, capturing the emotional depth of hip-hop.
    *   Use explicit lyrics strategically, replacing vowels in explicit words with different characters or symbols, For example, "F%ck the system, I'm the sh!t!, don't f*ckin' mess with me b#tch!"

### Enhancements for Performance
  
1. **Hooks**: Make the \[Chorus] memorable and easily repeatable, with powerful phrasing and a universal message. Incorporate catchy, rhythmic hooks that are quintessential to hip-hop.
2. **Build & Release**: Use the \[Bridge] to introduce tension, a twist, or a shift in perspective, leading to an impactful \[Outro] or final \[Chorus], a common technique in hip-hop storytelling.
3. **Ad-libs**: Include spaces for ad-libs, a key element of hip-hop performance, to enhance the energy and vibe (e.g., "Yeah", "Uh", "That's right").
  
### Examples of Complex Rhyme Patterns:
  
*   **AABBCC** (couplets): "I flip the script with every rhyme / I'm ahead of my time / I break the mold, never fold / My story's yet untold."
*   **ABAB** (alternating rhyme): "The beat drops, I elevate / A verbal assault, I seal your fate / My words resonate, never late / In this lyrical state, I dominate."
*   **AAA BBB** (grouped rhyme): "I'm on a mission, lyrical magician, with precision I envision / I break barriers, no carriers, my flow's scarier."

### Additional Guidelines:

**Hip-Hop Specifics**:

   - **Flow**: Ensure the lyrics have a natural, rhythmic flow that fits hip-hop beats. Use punchlines and wordplay to enhance the lyrical quality.
   - **Timing**: Pay close attention to the timing of each line, ensuring it fits within the 16-bar structure for verses and 8-bar structure for choruses.
   - **Energy**: Match the energy of the lyrics to the tempo of the beat, with faster flows for upbeat tracks and more laid-back flows for slower beats.
   - **Intellect**: Unless the user request something else then use technical and intellectual lyrics.
   - **Storytelling**: Incorporate storytelling elements to make the lyrics engaging and relatable.
   - **Social Commentary**: Address relevant social issues or themes to make the lyrics impactful and thought-provoking.
   - **Political Commentary**: Address relevant political issues or themes to make the lyrics impactful and thought-provoking.

### Formatting Rules

1. Start with the \[Intro], then progress logically through \[Verse1], \[Verse2], \[Pre-Chorus], \[Chorus], \[Verse3], \[Verse4], \[Pre-Chorus], \[Chorus], \[Interlude] or \[Instrumental Break], \[Bridge], \[Verse5], \[Pre-Chorus], \[Chorus], \[Outro]. Always end with \[END] and nothing after it.
2. Indicate mood or delivery notes in italics if needed (e.g., *aggressively*, *smoothly*, *with a laid-back flow*).
3. Keep the lyrics modular so they can easily adapt to different musical arrangements or beats.


 **NOTE**: ALL \[VERSES] ARE 16 BARS LONG. \[CHORUS] IS 8 OR 16 BARS LONG. \[PRE-CHORUS] IS 4 BARS LONG.BRIDGE] IS 8 BARS LONG. \[INTRO] IS 4 OR 6 LINES, SPOKEN, NARRATIVE, OR STORYTELLING STYLE.

 **IMPORTANT**: Emphasize creating a flow that is specifically tailored to hip-hop, with a focus on rhythmic delivery, varied cadences, and syncopation. The lyrics should naturally lend themselves to a rap performance, with an inherent bounce and rhythm.`,
          },
          {
            role: "user",
            content: `Generate complete song lyrics about "${theme}". Follow all formatting rules, structure requirements, and advanced techniques defined in the system prompt.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };

      const headers: Record<string, string> = {
        Authorization: `${selectedProvider.authHeaderPrefix || ""}` + apiKey,
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
        timeout: 60000, // 60 second timeout for generation
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
          setError(`Invalid request: ${errorMessage}`);
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
          setError(`API Error: ${errorMessage}. Please try again.`);
        }
      } else if (error instanceof Error) {
        if (error.message.includes("Network Error")) {
          console.error("Network Error details:", error);
          setError(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          console.error("Unexpected Error:", error);
          setError(`Error: ${error.message}`);
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
