import PasswordGenerator from '@/components/PasswordGenerator';

export default function GeneratorPage() {
  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Password Generator</h2>
      <PasswordGenerator />
    </div>
  );
}
