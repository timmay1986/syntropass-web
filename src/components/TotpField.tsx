import { useState, useEffect, useCallback } from 'react';
import * as OTPAuth from 'otpauth';

interface Props {
  uri?: string;   // otpauth://totp/...?secret=...
  secret?: string; // bare Base32 secret
}

export default function TotpField({ uri, secret }: Props) {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    try {
      let totp: OTPAuth.TOTP;
      if (uri) {
        const parsed = OTPAuth.URI.parse(uri);
        if (!(parsed instanceof OTPAuth.TOTP)) return;
        totp = parsed;
      } else if (secret) {
        const clean = secret.replace(/[\s-]/g, '').toUpperCase();
        totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(clean),
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
        });
      } else {
        return;
      }
      setCode(totp.generate());
      const period = totp.period || 30;
      setRemaining(period - (Math.floor(Date.now() / 1000) % period));
      setError('');
    } catch (err: any) {
      setError('Invalid TOTP');
    }
  }, [uri, secret]);

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

const OTP_LABEL_PATTERN = /^(einmalpasswort|otp|totp|2fa|one.?time|authenticator|mfa)$/i;
const BASE32_PATTERN = /^[A-Za-z2-7]{16,}=*$/;

/** Check if a custom field is a TOTP secret based on label + value */
export function isTotpField(label: string, value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  if (isOtpAuthUri(value)) return true;
  const clean = value.replace(/[\s-]/g, '');
  return OTP_LABEL_PATTERN.test(label.trim()) && BASE32_PATTERN.test(clean);
}
