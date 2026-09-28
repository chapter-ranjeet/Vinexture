import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:bg-slate-950",
        secondary: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-sm active:bg-slate-100",
        outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
        ghost: "hover:bg-slate-100 text-slate-700 active:bg-slate-200",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 py-1.5 text-xs",
        lg: "h-12 px-6 py-3",
        icon: "h-10 w-10 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, loadingText, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), isLoading && "opacity-80 cursor-wait")}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

