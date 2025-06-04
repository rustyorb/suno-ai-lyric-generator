import { useEffect, useState } from "react";
import rhyme from "rhyme";
import { syllable } from "syllable";

interface RhymeMap {
  [ending: string]: string[];
}

interface Props {
  lyrics: string;
}

const RhymeAnalyzer: React.FC<Props> = ({ lyrics }) => {
  const [analysis, setAnalysis] = useState<string[]>([]);

  useEffect(() => {
    const lines = lyrics.split(/\n+/).filter(Boolean);
    const rh = rhyme();
    const groups: RhymeMap = {};

    lines.forEach((line) => {
      const words = line.split(/\s+/);
      const lastWord = words[words.length - 1]?.replace(/[^a-zA-Z']/g, "");
      if (!lastWord) return;
      const rhymes = rh.rhyme(lastWord) as string[];
      const key = rhymes.length > 0 ? rhymes[0] : lastWord.slice(-3);
      if (!groups[key]) groups[key] = [];
      groups[key].push(lastWord.toLowerCase());
    });

    const annotated = lines.map((line) => {
      const count = syllable(line);
      return `${line} (${count})`;
    });
    setAnalysis(annotated);
  }, [lyrics]);

  if (!lyrics) return null;

  return (
    <div className="bg-gray-800 p-4 rounded mt-4">
      <h3 className="text-purple-400 mb-2">Rhyme & Cadence Analysis</h3>
      {analysis.map((line, idx) => (
        <p key={idx} className="text-gray-200">
          {line}
        </p>
      ))}
    </div>
  );
};

export default RhymeAnalyzer;
