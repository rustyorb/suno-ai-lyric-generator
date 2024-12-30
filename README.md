  # 🎤 Suno AI Lyric Generator

A multi-model lyric generation pipeline with advanced prompt engineering for [Suno AI](https://suno.ai). Generate structured, thematic lyrics with automatic vocal style markers and production notes.

## 🌟 Features

- 🤖 **Multi-Model Generation Pipeline**: Leverages multiple LLMs for specialized content generation
- 🎵 **Suno AI Integration**: Optimized prompts for Suno's music generation
- 🎨 **React Dashboard**: Clean, intuitive interface for lyric generation and management
- 🎸 **Multiple Style Templates**: Hip-hop, punk, metal, and more
- 🎼 **Advanced Structure Templates**: Various song structures with section-specific generation
- 🎤 **Automatic Vocal Markers**: Dynamic addition of adlibs and emphasis
- 💾 **History Management**: Store and browse previous generations

## 📋 Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Access to supported LLM APIs
- React development environment

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/rustyorb/suno-ai-lyric-generator.git
   cd suno-ai-lyric-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🛠️ Project Structure

```
suno-ai-lyric-generator/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # LLM integration services
│   ├── styles/           # CSS/styling files
│   └── utils/            # Helper functions
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🎯 Usage

1. **Select or enter your theme/topic**
2. **Choose a style template**
3. **Select structure template**
4. **Generate lyrics**
5. **Edit and refine as needed**
6. **Export for use with Suno AI**

## 🎸 Style Templates

Currently supported styles:
- Raw Hip-Hop
- Punk Rock
- Metalcore
- More coming soon!

## 📝 Structure Templates

1. **Conspiracy Truth**
   - Narrative Intro
   - Verse 1
   - Chorus
   - Verse 2
   - Bridge
   - Interlude
   - Chorus

2. **Street Knowledge**
   - Spoken Intro
   - Verse 1
   - Hook
   - Verse 2
   - Bridge
   - Final Verse
   - Outro

3. **Rebel Anthem**
   - Call to Arms
   - Verse 1
   - Rally Cry
   - Verse 2
   - Breakdown
   - Final Stand
   - Echo

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Suno AI](https://suno.ai) for their amazing music generation platform
- Various LLM providers for their language models
- The open-source community for inspiration and tools