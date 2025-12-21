import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function PinInput({ length = 4, onComplete, error = false, disabled = false }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (error) {
      setValues(Array(length).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [error, length]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== '') && newValues.join('').length === length) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newValues = [...values];
    pastedData.split('').forEach((char, i) => {
      if (i < length) newValues[i] = char;
    });
    setValues(newValues);

    if (newValues.every((v) => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 bg-card transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            error
              ? 'border-destructive focus:ring-destructive animate-shake'
              : 'border-border focus:border-primary focus:ring-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
