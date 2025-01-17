import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const generateWithAPI = async (
  model: string,
  messages: any[],
  settings: {
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  }
) => {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages,
        ...settings
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Hip-Hop Lyric Generator'
        }
      }
    );
    return {
      content: response.data.choices[0].message.content,
      error: null
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      content: null,
      error: error.message
    };
  }
};