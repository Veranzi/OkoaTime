"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="label">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "input-field",
              icon && "pl-10",
              error && "border-red-400 focus:ring-red-400",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-josefin">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
