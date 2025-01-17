'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAIProviders } from './providers'
import ProviderManager from './components/ProviderManager'

const SUNO_SONG_STRUCTURE = {
  sections: [
    { tag: '[Verse]', prompt: 'Generate the first verse' },
    { tag: '[Chorus]', prompt: 'Create a catchy, memorable chorus' },
    { tag: '[Verse]', prompt: 'Write a second verse with progression' },
    { tag: '[Bridge]', prompt: 'Compose a bridge that adds emotional depth' },
    { tag: '[Verse]', prompt: 'Craft a final verse that brings the song to a climax' }
  ]
}

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
    removeProvider
  } = useAIProviders()

  const [theme, setTheme] = useState('')
  const [generatedLyrics, setGeneratedLyrics] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showProviderManager, setShowProviderManager] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Comprehensive debugging of environment variables and API configuration
  useEffect(() => {
    const allEnvVars = {
      NEXT_PUBLIC_OPENROUTER_API_KEY: publicRuntimeConfig.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_OPENAI_API_KEY: publicRuntimeConfig.NEXT_PUBLIC_OPENAI_API_KEY ? 'SET' : 'NOT SET',
    }

    const providerDebug = providers.map(provider => ({
      name: provider.name,
      apiUrl: provider.apiUrl,
      modelsEndpoint: provider.modelsEndpoint,
      apiKeyStatus: process.env[provider.apiKeyEnvVar] ? 'SET' : 'NOT SET'
    }))

    const debug = {
      environmentVariables: allEnvVars,
      providers: providerDebug,
      apiKeyError,
      modelError
    }

    console.log('🔍 Debug Information:', debug)
    setDebugInfo(debug)
  }, [providers, apiKeyError, modelError])

  const generateLyrics = async () => {
    if (!theme.trim()) {
      setError('Please enter a theme')
      return
    }

    if (!selectedProvider || !selectedModel) {
      setError('Please select an AI provider and model')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedLyrics('')

    try {
      // Direct access to environment variables
      const OPENROUTER_API_KEY = publicRuntimeConfig.NEXT_PUBLIC_OPENROUTER_API_KEY || ''
      const OPENAI_API_KEY = publicRuntimeConfig.NEXT_PUBLIC_OPENAI_API_KEY || ''

      // Select API key based on provider
      const apiKey = selectedProvider.name === 'OpenRouter' 
        ? OPENROUTER_API_KEY 
        : selectedProvider.name === 'OpenAI'
        ? OPENAI_API_KEY
        : ''
      
      // Ultra-detailed logging for debugging
      const requestDebug = {
        provider: {
          name: selectedProvider.name,
          apiUrl: selectedProvider.apiUrl,
          modelsEndpoint: selectedProvider.modelsEndpoint,
        },
        model: selectedModel,
        apiKeyStatus: apiKey ? 'EXISTS' : 'MISSING',
        apiKeyLength: apiKey.length,
        headers: {
          'Authorization': `${selectedProvider.authHeaderPrefix || ''}[REDACTED]`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin
        }
      }
      
      console.log('📝 Request Configuration:', requestDebug)

      if (!apiKey) {
        throw new Error(`No API key found for ${selectedProvider.name}. 
        Available Keys: 
        OpenRouter: ${OPENROUTER_API_KEY ? 'EXISTS' : 'MISSING'}
        OpenAI: ${OPENAI_API_KEY ? 'EXISTS' : 'MISSING'}`)
      }

      let fullLyrics = ''

      for (const section of SUNO_SONG_STRUCTURE.sections) {
        console.log(`🎵 Generating ${section.tag}...`)
        
        const requestBody = {
          model: selectedModel.id,
          messages: [
            {
              role: 'system', 
              content: `You are an elite hip-hop lyricist creating lyrics for Suno AI. Use strict Suno vocal tag formatting. Always enclose lyrics in the appropriate section tag. Use parentheses () for callback/adlib vocals. Maintain complex rhyme schemes and authentic street wisdom.`
            },
            {
              role: 'user',
              content: `${section.prompt} about "${theme}". Ensure lyrics are tagged with ${section.tag}`
            }
          ],
          temperature: 0.7
        }

        console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2))

        const response = await axios.post(selectedProvider.apiUrl, 
          requestBody,
          {
            headers: {
              'Authorization': `${selectedProvider.authHeaderPrefix || ''}${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin
            }
          }
        )

        console.log(`📥 Response for ${section.tag}:`, response.data)

        const lyricContent = response.data.choices[0].message.content
        fullLyrics += `\n${section.tag}\n${lyricContent}\n`
      }

      setGeneratedLyrics(fullLyrics)
    } catch (error: unknown) {
      console.error('🚨 Lyric Generation Error:', error)
      
      // Enhanced error handling with type checking
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          message: error.message,
          response: {
            data: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
          },
          request: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        }
        console.error('🚨 API Error Details:', errorDetails)
        setError(`API Error: ${error.response?.data?.error || error.message}. Check console for details.`)
      } else {
        setError(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-500">
          Suno AI Lyric Generator
        </h1>

        {/* Debug Information */}
        <div className="bg-red-900 text-red-300 p-4 mb-4 rounded">
          <h2 className="font-bold mb-2">🐞 Debug Information</h2>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Provider
              </label>
              <select 
                value={selectedProvider?.name || ''}
                onChange={(e) => {
                  const provider = providers.find(p => p.name === e.target.value)
                  setSelectedProvider(provider || null)
                  setSelectedModel(null)
                }}
                className="w-full bg-gray-700 text-white p-2 rounded"
              >
                <option value="">Select Provider</option>
                {providers.map((provider) => (
                  <option key={provider.name} value={provider.name}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model {isLoadingModels && '(Loading...)'}
              </label>
              {modelError && (
                <div className="text-red-500 text-sm mb-2">{modelError}</div>
              )}
              <select 
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = availableModels.find(m => m.id === e.target.value)
                  setSelectedModel(model || null)
                }}
                disabled={!selectedProvider || isLoadingModels}
                className="w-full bg-gray-700 text-white p-2 rounded disabled:opacity-50"
              >
                <option value="">Select Model</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
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
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
            }`}
          >
            {isGenerating ? 'Generating Lyrics...' : 'Generate Lyrics'}
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
            {showProviderManager ? 'Hide' : 'Show'} Provider Manager
          </button>

          {showProviderManager && (
            <ProviderManager 
              providers={providers}
              addProvider={addProvider}
              removeProvider={removeProvider}
            />
          )}
        </div>
      </div>
    </main>
  )
}
