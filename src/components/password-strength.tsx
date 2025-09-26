
'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password?: string;
}

interface ValidationRule {
  id: 'length' | 'uppercase' | 'number' | 'specialChar';
  text: string;
  regex: RegExp;
}

const rules: ValidationRule[] = [
  { id: 'length', text: 'Pelo menos 8 caracteres', regex: /.{8,}/ },
  { id: 'uppercase', text: 'Pelo menos uma letra maiúscula', regex: /[A-Z]/ },
  { id: 'number', text: 'Pelo menos um número', regex: /[0-9]/ },
  { id: 'specialChar', text: 'Pelo menos um caractere especial', regex: /[^A-Za-z0-9]/ },
];

export default function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const getValidationState = (rule: ValidationRule) => {
    return rule.regex.test(password);
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {rules.map((rule) => {
          const isValid = getValidationState(rule);
          return (
            <li key={rule.id} className="flex items-center text-sm">
              {isValid ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn(isValid ? 'text-foreground' : 'text-muted-foreground')}>
                {rule.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
