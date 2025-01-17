import axios from 'axios';

// Enhanced logging utility
const logger = {
  log: (message: string, data?: any) => {
    console.log(`[AI Provider Service] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[AI Provider Service - ERROR] ${message}`, error || '');
  }
};

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
    let currentSectionType = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if it's a section header [Verse], [Chorus], etc.
      const sectionMatch = trimmedLine.match(/^\[(.*?)\]$/);
      
      if (sectionMatch) {
        // Get the section type (Verse, Chorus, etc.)
        const sectionType = sectionMatch[1].toLowerCase();
        
        // Only add if it's a new section type
        if (sectionType !== currentSectionType) {
          // Add a blank line before new sections (except the first one)
          if (cleanedLines.length > 0) {
            cleanedLines.push('');
          }
          cleanedLines.push(`[${sectionMatch[1]}]`);
          currentSectionType = sectionType;
        }
      } else {
        // For non-section lines (including adlibs in parentheses)
        if (trimmedLine || trimmedLine.startsWith('(')) {
          cleanedLines.push(line);
          // Reset section type when we hit actual content
          if (trimmedLine && !trimmedLine.startsWith('(')) {
            currentSectionType = '';
          }
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
    // Updated system prompt to be more explicit about not duplicating section tags
    const systemPrompt = `You are a professional lyricist. Generate creative, original song lyrics based on the following prompt. 
    Follow this format exactly:
    1. Use [Section] tags like [Intro], [Verse], [Chorus], [Bridge], etc. ONCE per section
    2. Add adlibs in (parentheses)
    3. Write engaging lyrics with a clear theme and poetic language
    DO NOT duplicate section tags - each section tag should appear exactly once.`;

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
          'Content-Type': 'application/json'
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