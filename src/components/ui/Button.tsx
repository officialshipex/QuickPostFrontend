import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
    
    // Variant styles
    const variants = {
      default: "bg-primary text-white hover:bg-primary/90 shadow-sm",
      secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-sm",
      outline: "border border-border bg-background hover:bg-muted text-secondary",
      ghost: "hover:bg-muted text-secondary hover:text-secondary",
      link: "text-primary underline-offset-4 hover:underline",
    };
    
    // Size styles
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-12 rounded-md px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
