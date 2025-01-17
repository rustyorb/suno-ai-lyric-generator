'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

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
    name: 'OpenRouter',
    apiUrl: 'https://api.openrouter.ai/api/v1/chat/completions',
    apiKeyEnvVar: 'NEXT_PUBLIC_OPENROUTER_API_KEY',
    modelsEndpoint: 'https://api.openrouter.ai/api/v1/models',
    authHeaderPrefix: 'Bearer ',
    modelPathInResponse: '',
    modelNamePath: 'name',
    modelIdPath: 'id'
  },
  {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKeyEnvVar: 'NEXT_PUBLIC_OPENAI_API_KEY',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    authHeaderPrefix: 'Bearer ',
    modelPathInResponse: 'data',
    modelNamePath: 'id',
    modelIdPath: 'id'
  }
]

export function useAIProviders() {
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [selectedModel, setSelectedModel] = useState<{id: string, name: string} | null>(null)
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  // Validate API key
  const validateApiKey = (provider: AIProvider) => {
    const apiKey = process.env[provider.apiKeyEnvVar]
    
    if (!apiKey) {
      setApiKeyError(`No API key found for ${provider.name}`)
      return false
    }

    // Basic validation for OpenRouter and OpenAI key formats
    const keyValidationRegex = /^sk-[a-zA-Z0-9-_]{40,}$/
    if (!keyValidationRegex.test(apiKey)) {
      setApiKeyError(`Invalid API key format for ${provider.name}`)
      return false
    }

    setApiKeyError(null)
    return true
  }

  // Fetch models for a selected provider
  const fetchModels = async (provider: AIProvider) => {
    // First validate API key
    if (!validateApiKey(provider)) {
      return
    }

    if (!provider.modelsEndpoint) {
      setModelError('No models endpoint defined for this provider')
      setAvailableModels([])
      return
    }

    setIsLoadingModels(true)
    setModelError(null)

    try {
      const apiKey = process.env[provider.apiKeyEnvVar]
      
      const response = await axios.get(provider.modelsEndpoint, {
        headers: {
          'Authorization': `${provider.authHeaderPrefix || ''}${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin
        }
      })

      let models: {id: string, name: string}[] = []

      // Extract models based on provider-specific path
      if (provider.modelPathInResponse) {
        const data = provider.modelPathInResponse 
          ? response.data[provider.modelPathInResponse] 
          : response.data

        models = data.map((model: any) => ({
          id: model[provider.modelIdPath || 'id'],
          name: model[provider.modelNamePath || 'name']
        }))
      } else {
        // Fallback to direct mapping
        models = response.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id
        }))
      }

      // Filter out models that are clearly not LLM chat models
      const filteredModels = models.filter(model => 
        model.id.includes('gpt') || 
        model.id.includes('claude') || 
        model.id.includes('llama') || 
        model.id.includes('mixtral') ||
        model.id.includes('chat') ||
        model.name.toLowerCase().includes('chat')
      )

      setAvailableModels(filteredModels)
      setSelectedModel(null)
    } catch (error: unknown) {
      console.error('Error fetching models:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setModelError(`Failed to fetch models: ${errorMessage}`)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  // When a provider is selected, fetch its models
  useEffect(() => {
    if (selectedProvider) {
      fetchModels(selectedProvider)
    }
  }, [selectedProvider])

  const addProvider = (newProvider: AIProvider) => {
    const updatedProviders = [...providers, newProvider]
    setProviders(updatedProviders)
    
    // Store custom providers in local storage
    const customProviders = updatedProviders.filter(p => 
      !DEFAULT_PROVIDERS.some(dp => dp.name === p.name)
    )
    localStorage.setItem('aiProviders', JSON.stringify(customProviders))
  }

  const removeProvider = (providerName: string) => {
    const updatedProviders = providers.filter(p => p.name !== providerName)
    setProviders(updatedProviders)
    
    // Update local storage
    const customProviders = updatedProviders.filter(p => 
      !DEFAULT_PROVIDERS.some(dp => dp.name === p.name)
    )
    localStorage.setItem('aiProviders', JSON.stringify(customProviders))
  }

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
    fetchModels
  }
}
