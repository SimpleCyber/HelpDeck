import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  loading, 
  className, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "btn-primary",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "hover:bg-gray-100 text-gray-600"
  };

  return (
    <button 
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50",
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
