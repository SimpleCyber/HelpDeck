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
    primary: "btn-primary shadow-lg shadow-blue-500/20",
    secondary: "bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-card)]",
    danger: "bg-red-50 dark:bg-slate-900 text-red-600 hover:bg-red-100 dark:hover:bg-slate-800 border border-red-100 dark:border-red-900/30",
    ghost: "hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-blue-600"
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
