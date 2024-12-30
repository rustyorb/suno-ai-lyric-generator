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
  