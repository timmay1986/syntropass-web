import { useState, useEffect, useCallback } from 'react';
import * as OTPAuth from 'otpauth';

interface Props {
  uri: string; // otpauth://totp/...?secret=...
}

export default function TotpField({ uri }: Props) {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    try {
      const totp = OTPAuth.URI.parse(uri);
      if (totp instanceof OTPAuth.TOTP) {
        setCode(totp.generate());
        const period = totp.period || 30;
        setRemaining(period - (Math.floor(Date.now() / 1000) % period));
        setError('');
      }
    } catch (err: any) {
      setError('Invalid TOTP');
    }
  }, [uri]);

  useEffect(() => {
    generate();
    const interval = setInterval(generate, 1000);
    return () => clearInterval(interval);
  }, [generate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return <span className="text-red-400 text-xs">{error}</span>;
  if (!code) return null;

  const progress = (remaining / 30) * 100;
  const isLow = remaining <= 7;

  return (
    <div className="flex items-center gap-3">
      {/* Countdown ring */}
      <div className="relative w-9 h-9 shrink-0">
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#27272a" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15" fill="none"
            stroke={isLow ? '#f59e0b' : '#3b82f6'}
            strokeWidth="2.5"
            strokeDasharray={`${progress * 0.94} 94`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium ${isLow ? 'text-amber-400' : 'text-zinc-400'}`}>
          {remaining}
        </span>
      </div>

      {/* Code */}
      <span className="font-mono text-xl tracking-[0.3em] text-zinc-100 font-semibold">
        {code.substring(0, 3)} {code.substring(3)}
      </span>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="text-xs text-zinc-500 hover:text-zinc-300 shrink-0"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

/** Check if a string is an otpauth:// URI */
export function isOtpAuthUri(value: string): boolean {
  return typeof value === 'string' && value.startsWith('otpauth://');
}
