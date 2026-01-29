import React, { useState, useRef } from 'react';
import { useGame, defaultSettings } from '../context/GameContext';
import { GameSettings, QuestionPack } from '../types';
import { validateQuestionPack, normalizeQuestionPack } from '../utils/validation';

export function SetupPage() {
  const { startGame } = useGame();
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [questionPack, setQuestionPack] = useState<QuestionPack | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSettingChange = (key: keyof GameSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiplierChange = (index: number, value: number) => {
    setSettings((prev) => {
      const newMultipliers = [...prev.multipliers];
      newMultipliers[index] = value;
      return { ...prev, multipliers: newMultipliers };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        processJson(content);
      } catch {
        setErrors(['Failed to read file']);
      }
    };
    reader.readAsText(file);
  };

  const handleJsonPaste = () => {
    processJson(jsonInput);
  };

  const processJson = (content: string) => {
    try {
      const data = JSON.parse(content);
      const validation = validateQuestionPack(data);

      if (!validation.valid) {
        setErrors(validation.errors);
        setQuestionPack(null);
        return;
      }

      const normalized = normalizeQuestionPack(data);
      setQuestionPack(normalized);
      setErrors([]);
      
      if (normalized.rounds.length < settings.numberOfRounds) {
        handleSettingChange('numberOfRounds', normalized.rounds.length);
      }
    } catch {
      setErrors(['Invalid JSON format']);
      setQuestionPack(null);
    }
  };

  const loadSampleQuestions = async () => {
    try {
      const response = await fetch('/sample.familyfeud.json');
      const data = await response.json();
      const normalized = normalizeQuestionPack(data);
      setQuestionPack(normalized);
      setErrors([]);
      
      if (normalized.rounds.length < settings.numberOfRounds) {
        handleSettingChange('numberOfRounds', normalized.rounds.length);
      }
    } catch {
      setErrors(['Failed to load sample questions']);
    }
  };

  const handleStartGame = () => {
    if (!questionPack) {
      setErrors(['Please load a question pack first']);
      return;
    }
    startGame(settings, questionPack);
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="logo-text text-6xl md:text-7xl mb-2">FAMILY FEUD</h1>
          <p className="text-xl text-gray-400">MSA Game Night Edition</p>
        </div>

        {/* Main Setup Card */}
        <div className="bg-black/40 border-4 border-yellow-500 rounded-2xl p-8">
          
          {/* Team Names */}
          <section className="mb-8">
            <h2 className="text-2xl font-display text-yellow-400 mb-4 border-b border-yellow-500/30 pb-2">
              Team Setup
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Team 1 Name</label>
                <input
                  type="text"
                  value={settings.teamAName}
                  onChange={(e) => handleSettingChange('teamAName', e.target.value)}
                  className="w-full bg-blue-900/50 border-2 border-blue-500 rounded-lg px-4 py-3 text-white text-lg focus:border-blue-400"
                  placeholder="Team A"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Team 2 Name</label>
                <input
                  type="text"
                  value={settings.teamBName}
                  onChange={(e) => handleSettingChange('teamBName', e.target.value)}
                  className="w-full bg-red-900/50 border-2 border-red-500 rounded-lg px-4 py-3 text-white text-lg focus:border-red-400"
                  placeholder="Team B"
                />
              </div>
            </div>
          </section>

          {/* Game Settings */}
          <section className="mb-8">
            <h2 className="text-2xl font-display text-yellow-400 mb-4 border-b border-yellow-500/30 pb-2">
              Game Settings
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Number of Rounds</label>
                <select
                  value={settings.numberOfRounds}
                  onChange={(e) => handleSettingChange('numberOfRounds', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border-2 border-yellow-500/50 rounded-lg px-4 py-3 text-white focus:border-yellow-400"
                >
                  {[3, 4, 5, 6, 7, 8, 10, 12, 15].map((n) => (
                    <option key={n} value={n} disabled={questionPack ? n > questionPack.rounds.length : false}>
                      {n} Rounds
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Strikes Per Round</label>
                <select
                  value={settings.strikeLimit}
                  onChange={(e) => handleSettingChange('strikeLimit', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border-2 border-yellow-500/50 rounded-lg px-4 py-3 text-white focus:border-yellow-400"
                >
                  <option value={3}>3 Strikes (Classic)</option>
                  <option value={2}>2 Strikes (Hard)</option>
                  <option value={4}>4 Strikes (Easy)</option>
                </select>
              </div>
            </div>

            {/* Multipliers */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-3">Round Multipliers</label>
              <div className="flex flex-wrap gap-3">
                {settings.multipliers.slice(0, Math.min(settings.numberOfRounds, 10)).map((mult, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">R{index + 1}</div>
                    <select
                      value={mult}
                      onChange={(e) => handleMultiplierChange(index, parseInt(e.target.value))}
                      className="bg-gray-800 border-2 border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-400 text-center w-16"
                    >
                      {[1, 2, 3].map((n) => (
                        <option key={n} value={n}>×{n}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Question Bank */}
          <section className="mb-8">
            <h2 className="text-2xl font-display text-yellow-400 mb-4 border-b border-yellow-500/30 pb-2">
              Questions
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={loadSampleQuestions}
                className="bg-green-700 hover:bg-green-600 border-2 border-green-500 rounded-xl p-4 text-center transition-colors"
              >
                <span className="text-2xl block mb-1">🎮</span>
                <span className="text-white font-medium">Load Sample</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-xl p-4 text-center transition-colors"
              >
                <span className="text-2xl block mb-1">📁</span>
                <span className="text-gray-300">Upload JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => setShowJsonPaste(!showJsonPaste)}
                className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-xl p-4 text-center transition-colors"
              >
                <span className="text-2xl block mb-1">📝</span>
                <span className="text-gray-300">Paste JSON</span>
              </button>
            </div>

            {showJsonPaste && (
              <div className="space-y-3 mb-4">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON here..."
                  className="w-full h-32 bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <button
                  onClick={handleJsonPaste}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Process JSON
                </button>
              </div>
            )}

            {questionPack && (
              <div className="bg-green-900/30 border-2 border-green-500 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-green-400 font-bold">{questionPack.title}</span>
                </div>
                <p className="text-gray-300 mt-1">{questionPack.rounds.length} questions loaded</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4 mt-4">
                <p className="text-red-400 font-bold mb-2">Errors:</p>
                <ul className="list-disc list-inside text-red-300 text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            disabled={!questionPack}
            className="w-full btn-glow bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-xl text-2xl transition-colors"
          >
            🎬 START GAME
          </button>
        </div>

        {/* Tips */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Tip: Press F11 for fullscreen • Press H to hide host controls during game</p>
        </div>
      </div>
    </div>
  );
}
