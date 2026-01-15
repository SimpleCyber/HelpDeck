import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full space-y-1">
      {label && <label className="block text-sm font-semibold text-[var(--text-main)]">{label}</label>}
      <input 
        className={cn("input-field", error && "border-red-500 focus:ring-red-500", className)}
        {...props} 
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
