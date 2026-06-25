import * as React from "react"
import { cn } from "../../utils/cn"

const typographyVariants = {
  h1: "text-4xl font-extrabold tracking-tight lg:text-5xl text-secondary",
  h2: "text-3xl font-bold tracking-tight text-secondary",
  h3: "text-2xl font-semibold tracking-tight text-secondary",
  h4: "text-xl font-semibold tracking-tight text-secondary",
  p: "leading-7 text-secondary/80",
  lead: "text-xl text-secondary/70",
  large: "text-lg font-semibold text-secondary",
  small: "text-sm font-medium leading-none text-secondary/80",
  muted: "text-sm text-secondary/60",
}

type TypographyVariant = keyof typeof typographyVariants

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant
  as?: React.ElementType
}

export function Typography({
  className,
  variant = "p",
  as,
  ...props
}: TypographyProps) {
  const defaultElement = ["h1", "h2", "h3", "h4", "p"].includes(variant as string) ? variant : "p";
  const Comp: React.ElementType = as || (defaultElement as React.ElementType);
  
  return (
    <Comp
      className={cn(typographyVariants[variant], className)}
      {...props}
    />
  )
}
