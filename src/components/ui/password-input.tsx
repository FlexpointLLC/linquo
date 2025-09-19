"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  showValidation?: boolean;
  className?: string;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    label: "8 Characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "1 Number",
    test: (password) => /\d/.test(password),
  },
  {
    label: "1 Uppercase",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "1 Lowercase",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "1 Special Character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function PasswordInput({
  value,
  onChange,
  placeholder = "Enter your password",
  id,
  required = false,
  showValidation = false,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // const isPasswordValid = showValidation && validationRules.every(rule => rule.test(value));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn("pr-10", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {showValidation && value && (
        <div className="space-y-1">
          {validationRules.map((rule, index) => {
            const isValid = rule.test(value);
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                {isValid ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "text-xs",
                  isValid ? "text-green-600" : "text-red-600"
                )}>
                  {rule.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
