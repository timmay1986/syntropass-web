import { useState, useCallback } from 'react';
import { generatePassword, generatePassphrase } from '@syntropass/crypto';
import CopyButton from './CopyButton';

export default function PasswordGenerator() {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [result, setResult] = useState('');

  // Password options
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  // Passphrase options
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [capitalize, setCapitalize] = useState(true);
  const [includeNumber, setIncludeNumber] = useState(true);

  const generate = useCallback(() => {
    if (mode === 'password') {
      setResult(generatePassword({ length, uppercase, lowercase, digits, symbols, excludeAmbiguous }));
    } else {
      setResult(generatePassphrase({ wordCount, separator, capitalize, includeNumber }));
    }
  }, [mode, length, uppercase, lowercase, digits, symbols, excludeAmbiguous, wordCount, separator, capitalize, includeNumber]);

  return (
    <div className="space-y-6">
      {/* Result */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-zinc-400">Generated {mode}</p>
          <div className="flex gap-2">
            <CopyButton value={result} />
            <button onClick={generate} className="text-xs text-blue-400 hover:text-blue-300">Regenerate</button>
          </div>
        </div>
        <p className="font-mono text-lg text-zinc-100 break-all min-h-[2rem]">
          {result || <span className="text-zinc-600">Click Generate</span>}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={() => setMode('password')}
          className={`px-4 py-2 rounded-lg text-sm ${mode === 'password' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
          Password
        </button>
        <button onClick={() => setMode('passphrase')}
          className={`px-4 py-2 rounded-lg text-sm ${mode === 'passphrase' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
          Passphrase
        </button>
      </div>

      {/* Options */}
      {mode === 'password' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-400">Length: {length}</label>
            <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(+e.target.value)}
              className="w-48 accent-blue-500" />
          </div>
          {[
            ['Uppercase (A-Z)', uppercase, setUppercase],
            ['Lowercase (a-z)', lowercase, setLowercase],
            ['Digits (0-9)', digits, setDigits],
            ['Symbols (!@#$)', symbols, setSymbols],
            ['Exclude ambiguous (0/O, l/1)', excludeAmbiguous, setExcludeAmbiguous],
          ].map(([label, value, setter]: any) => (
            <label key={label} className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)}
                className="accent-blue-500" />
              {label}
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-400">Words: {wordCount}</label>
            <input type="range" min={3} max={8} value={wordCount} onChange={(e) => setWordCount(+e.target.value)}
              className="w-48 accent-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">Separator:</label>
            <input type="text" value={separator} onChange={(e) => setSeparator(e.target.value)} maxLength={3}
              className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-center text-sm" />
          </div>
          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} className="accent-blue-500" />
            Capitalize words
          </label>
          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={includeNumber} onChange={(e) => setIncludeNumber(e.target.checked)} className="accent-blue-500" />
            Include number
          </label>
        </div>
      )}

      <button onClick={generate}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors">
        Generate
      </button>
    </div>
  );
}
