import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import _ from 'lodash';

const LyricGenerator = () => {
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState('raw_hiphop');
  const [structure, setStructure] = useState('conspiracy_truth');
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [generationHistory, setGenerationHistory] = useState([]);
  
  useEffect(() => {
    // Load previous generations from filesystem
    const loadHistory = async () => {
      try {
        const files = await window.fs.readDir('.');
        const lyricFiles = files.filter(f => f.startsWith('lyrics_'));
        const history = await Promise.all(
          lyricFiles.map(async file => {
            const content = await window.fs.readFile(file, 'utf8');
            return {
              filename: file,
              content,
              timestamp: file.replace('lyrics_', '').replace('.md', '')
            };
          })
        );
        setGenerationHistory(history);
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };
    
    loadHistory();
  }, []);
  
  const styles = {
    raw_hiphop: {
      name: 'Raw Hip-Hop',
      template: '[STYLE: Hip hop, spoken word, conscious rap, intense delivery, raw unfiltered vocals]'
    },
    punk_rock: {
      name: 'Punk Rock',
      template: '[STYLE: Aggressive punk, raw vocals, distorted guitars, anti-establishment vibe]'
    },
    metal_core: {
      name: 'Metalcore',
      template: '[STYLE: Heavy metal, screamed verses, melodic chorus, intense breakdowns]'
    }
  };

  const structures = {
    conspiracy_truth: {
      name: 'Conspiracy Truth',
      sections: ['Narrative Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Interlude', 'Chorus']
    },
    street_knowledge: {
      name: 'Street Knowledge',
      sections: ['Spoken Intro', 'Verse 1', 'Hook', 'Verse 2', 'Bridge', 'Final Verse', 'Outro']
    },
    rebel_anthem: {
      name: 'Rebel Anthem',
      sections: ['Call to Arms', 'Verse 1', 'Rally Cry', 'Verse 2', 'Breakdown', 'Final Stand', 'Echo']
    }
  };

  const generateWithMistral = async (prompt) => {
    try {
      const response = await window.Mistral7BInstructV03Chat({
        message: prompt
      });
      return response;
    } catch (error) {
      console.error('Mistral generation error:', error);
      return null;
    }
  };

  const generateWithQwen = async (prompt) => {
    try {
      const response = await window.Qwen2572BInstructModelChat({
        query: prompt,
        system: "You are a lyric generation expert specializing in raw, unfiltered verses with complex rhyme schemes."
      });
      return response;
    } catch (error) {
      console.error('Qwen generation error:', error);
      return null;
    }
  };

  const generateSection = async (sectionType, theme) => {
    let prompt = '';
    switch (sectionType) {
      case 'Narrative Intro':
      case 'Interlude':
        prompt = `Generate a raw, unfiltered ${sectionType.toLowerCase()} about ${theme}. Make it intense and conversational, like someone speaking truth directly to the listener. Include vocal style markers like (yo..) or (listen up..) where appropriate.`;
        return await generateWithQwen(prompt); // Qwen is better at prose
        
      case 'Verse 1':
      case 'Verse 2':
        prompt = `Generate a raw, unfiltered hip-hop verse about ${theme}. Use internal rhymes, vivid imagery, and maintain an intense, truth-telling voice. Focus on unique metaphors and keep it real.`;
        return await generateWithMistral(prompt); // Mistral is better at structured rhymes
        
      case 'Chorus':
      case 'Hook':
        prompt = `Generate a memorable, powerful chorus about ${theme}. Make it catchy but raw, with strong end rhymes and a message that hits hard. Include vocal adlibs where appropriate.`;
        return await generateWithQwen(prompt); // Qwen is good at memorable hooks
        
      case 'Bridge':
        prompt = `Generate a bridge section about ${theme} that breaks the pattern. Mix metaphors and raw truth-telling. Can include spoken word elements.`;
        return await generateWithMistral(prompt); // Mistral handles pattern breaks well
        
      default:
        return '';
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    let fullLyrics = '';
    
    try {
      // Save to filesystem for future reference
      const timestamp = new Date().toISOString();
      const filename = `lyrics_${timestamp}.md`;
      
      // Generate each section based on selected structure
      for (const section of structures[structure].sections) {
        setCurrentSection(section);
        const sectionContent = await generateSection(section, theme);
        
        if (sectionContent) {
          fullLyrics += `\n[${section}]\n\n${sectionContent}\n`;
        }
      }
      
      // Add style markers and clean up
      fullLyrics = fullLyrics.replace(/([!?.])\s+/g, '$1 (yo..)\n');
      fullLyrics = fullLyrics.replace(/truth/gi, 'truth (preach!)');
      
      setGeneratedLyrics(fullLyrics);
      
      // Save to filesystem
      await window.fs.writeFile(filename, fullLyrics);
      
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratedLyrics('Error during generation. Please try again.');
    } finally {
      setIsGenerating(false);
      setCurrentSection('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Multi-Model Lyric Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Theme/Topic</Label>
              <Input 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Enter your theme or topic"
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Style</Label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {Object.entries(styles).map(([key, data]) => (
                    <option key={key} value={key}>{data.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Structure</Label>
                <select
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {Object.entries(structures).map(([key, data]) => (
                    <option key={key} value={key}>{data.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Tabs defaultValue="template">
              <TabsList>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="generated">Generated</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="template">
                <Alert>
                  <AlertDescription>
                    <pre className="whitespace-pre-wrap">
                      {styles[style].template}
                      {'\n\nStructure:\n' + structures[structure].sections.join('\n')}
                    </pre>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="history">
                <div className="space-y-4">
                  {generationHistory.map((entry) => (
                    <Card key={entry.timestamp} className="p-4">
                      <CardTitle className="text-sm text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </CardTitle>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm">
                          {entry.content}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="generated">
                <Textarea
                  value={generatedLyrics}
                  readOnly
                  className="w-full h-96"
                />
              </TabsContent>
              
              <TabsContent value="edit">
                <Textarea
                  value={generatedLyrics}
                  onChange={(e) => setGeneratedLyrics(e.target.value)}
                  className="w-full h-96"
                />
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Lyrics'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LyricGenerator;
