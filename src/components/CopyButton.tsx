import { useState } from 'react';

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
