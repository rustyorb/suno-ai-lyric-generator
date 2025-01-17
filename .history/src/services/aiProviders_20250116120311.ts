import axios from 'axios';
import { logger } from './utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseURL?: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens?: number;
  capabilities?: string[];
}

export class AIProviderService {
  private providers: AIProvider[] = [];
  private static STORAGE_KEY = 'suno_ai_lyric_providers';

  constructor() {
    this.loadProviders();
  }

  private cleanupLyricFormat(lyrics: string): string {
    const lines = lyrics.split('\n');
    const cleanedLines: string[] = [];
    const seenSections = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if it's a section header [Verse], [Chorus], etc.
      const sectionMatch = trimmedLine.match(/^\[(.*?)\]$/);
      
      if (sectionMatch) {
        // Get the section type (Verse, Chorus, etc.)
        const sectionType = sectionMatch[1].toLowerCase();
        
        // Only add if we haven't seen this section type before
        if (!seenSections.has(sectionType)) {
          // Add a blank line before new sections (except the first one)
          if (cleanedLines.length > 0) {
            cleanedLines.push('');
          }
          cleanedLines.push(`[${sectionMatch[1]}]`);
          seenSections.add(sectionType);
        }
      } else {
        // For non-section lines (including adlibs in parentheses)
        if (trimmedLine || trimmedLine.startsWith('(')) {
          cleanedLines.push(line);
        } else if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
          // Add empty line only if previous line wasn't empty
          cleanedLines.push('');
        }
      }
    }

    // Join lines and clean up any remaining multiple blank lines
    return cleanedLines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async addProvider(providerData: Omit<AIProvider, 'models'>): Promise<AIProvider> {
    if (!providerData.id || !providerData.name || !providerData.apiKey) {
      throw new Error('Provider must have an ID, name, and API key');
    }

    try {
      const models = await this.discoverModels(providerData);
      
      if (models.length === 0) {
        logger.error(`No models found for provider: ${providerData.name}`);
        throw new Error(`Unable to discover models for ${providerData.name}`);
      }

      const fullProvider: AIProvider = {
        ...providerData,
        models
      };

      this.providers = this.providers.filter(p => p.id !== providerData.id);
      this.providers.push(fullProvider);
      this.saveProviders();
      
      logger.log(`Added provider: ${fullProvider.name}`, {
        providerModels: models.map(m => m.name)
      });
      
      return fullProvider;
    } catch (error) {
      logger.error(`Failed to add provider ${providerData.name}`, error);
      throw error;
    }
  }

  private async discoverOpenAIModels(provider: Omit<AIProvider, 'models'>): Promise<AIModel[]> {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`
        }
      });

      const chatModels = response.data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id.split('-').map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          provider: 'OpenAI',
          maxTokens: model.id.includes('32k') ? 32768 :
                     model.id.includes('16k') ? 16384 :
                     model.id.includes('gpt-4') ? 8192 : 4096
        }));

      return chatModels;
    } catch (error) {
      logger.error('OpenAI model discovery failed', error);
      return [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokens: 4096 },
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', maxTokens: 8192 }
      ];
    }
  }

  private discoverAnthropicModels(provider: Omit<AIProvider, 'models'>): AIModel[] {
    return [
      { id: 'claude-2.1', name: 'Claude 2.1', provider: 'Anthropic', maxTokens: 100000 },
      { id: 'claude-instant-1.2', name: 'Claude Instant 1.2', provider: 'Anthropic', maxTokens: 100000 }
    ];
  }

  private async discoverOpenRouterModels(provider: Omit<AIProvider, 'models'>): Promise<AIModel[]> {
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Suno AI Lyric Generator v2'
        }
      });

      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'OpenRouter',
        maxTokens: model.context_length || 4096
      }));
    } catch (error) {
      logger.error('OpenRouter model discovery failed', error);
      return [
        { id: 'anthropic/claude-v1', name: 'Claude v1', provider: 'OpenRouter', maxTokens: 4096 }
      ];
    }
  }

  private async discoverModels(provider: Omit<AIProvider, 'models'>): Promise<AIModel[]> {
    const providerName = provider.name.toLowerCase();
    
    try {
      switch(providerName) {
        case 'openai':
          return await this.discoverOpenAIModels(provider);
        case 'anthropic':
          return this.discoverAnthropicModels(provider);
        case 'openrouter':
          return await this.discoverOpenRouterModels(provider);
        default:
          logger.error(`Unsupported provider: ${providerName}`);
          return [];
      }
    } catch (error) {
      logger.error(`Model discovery failed for ${providerName}`, error);
      
      switch(providerName) {
        case 'openai':
          return [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokens: 4096 },
            { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', maxTokens: 8192 }
          ];
        case 'anthropic':
          return this.discoverAnthropicModels(provider);
        case 'openrouter':
          return [
            { id: 'anthropic/claude-v1', name: 'Claude v1', provider: 'OpenRouter', maxTokens: 4096 }
          ];
        default:
          return [];
      }
    }
  }

  async generateLyrics(model: AIModel, prompt: string): Promise<string> {
    logger.log(`Generating lyrics with model: ${model.name}`, { prompt });

    const provider = this.providers.find(p => p.name.toLowerCase() === model.provider.toLowerCase());
    
    if (!provider) {
      logger.error(`Provider not found for model: ${model.name}`);
      throw new Error('Provider not configured');
    }

    try {
      const lyrics = await this.callModelForLyrics(provider, model, prompt);
      
      if (!lyrics || lyrics.trim().length < 50) {
        logger.error('Generated lyrics are too short', { lyrics });
        throw new Error('Failed to generate meaningful lyrics');
      }

      logger.log('Lyrics generated successfully', { 
        modelUsed: model.name, 
        lyricLength: lyrics.length 
      });

      return this.cleanupLyricFormat(lyrics);
    } catch (error) {
      logger.error('Lyrics generation failed', error);
      throw error;
    }
  }

  private async callModelForLyrics(
    provider: AIProvider, 
    model: AIModel, 
    prompt: string
  ): Promise<string> {
    const systemPrompt = await fs.readFile(
      path.join(process.cwd(), 'src/services/prompts/lyricGeneration.md'),
      'utf-8'
    );

    switch(provider.name.toLowerCase()) {
      case 'openai':
        return this.callOpenAILyricGeneration(provider, model, systemPrompt, prompt);
      case 'anthropic':
        return this.callAnthropicLyricGeneration(provider, model, systemPrompt, prompt);
      case 'openrouter':
        return this.callOpenRouterLyricGeneration(provider, model, systemPrompt, prompt);
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  private async callOpenAILyricGeneration(
    provider: AIProvider, 
    model: AIModel, 
    systemPrompt: string, 
    prompt: string
  ): Promise<string> {
    const response = await axios.post(
      provider.baseURL || 'https://api.openai.com/v1/chat/completions', 
      {
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: model.maxTokens || 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  private async callAnthropicLyricGeneration(
    provider: AIProvider, 
    model: AIModel, 
    systemPrompt: string, 
    prompt: string
  ): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages', 
      {
        model: model.id,
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${prompt}` }
        ],
        max_tokens: model.maxTokens || 1000,
        temperature: 0.7
      },
      {
        headers: {
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.content[0].text.trim();
  }

  private async callOpenRouterLyricGeneration(
    provider: AIProvider, 
    model: AIModel, 
    systemPrompt: string, 
    prompt: string
  ): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions', 
      {
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: model.maxTokens || 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Suno AI Lyric Generator v2'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  private saveProviders(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AIProviderService.STORAGE_KEY, JSON.stringify(this.providers));
        logger.log('Providers saved to local storage');
      }
    } catch (error) {
      logger.error('Failed to save providers to local storage', error);
    }
  }

  private loadProviders(): void {
    try {
      if (typeof window !== 'undefined') {
        const savedProvidersJson = localStorage.getItem(AIProviderService.STORAGE_KEY);
        if (savedProvidersJson) {
          this.providers = JSON.parse(savedProvidersJson);
          logger.log(`Loaded ${this.providers.length} providers from local storage`);
        }
      }
    } catch (error) {
      logger.error('Failed to load providers from local storage', error);
    }
  }

  getProviders(): AIProvider[] {
    return this.providers;
  }

  async testProviderConnection(provider: AIProvider): Promise<boolean> {
    try {
      await this.discoverModels(provider);
      return true;
    } catch (error) {
      logger.error(`Provider connection test failed for ${provider.name}`, error);
      return false;
    }
  }
}

export const aiProviderService = new AIProviderService();