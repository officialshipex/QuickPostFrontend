import * as React from 'react';
import { cn } from '../../utils/cn';

/** The sweeping highlight itself — drop into any `relative overflow-hidden group` element. */
function ShineSweep() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-2/5 -translate-x-[130%] -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/55 to-transparent group-hover:animate-[buttonShine_0.75s_ease-out]"
    />
  );
}

/**
 * Button with a one-shot diagonal shine sweep on hover (plays once per
 * hover, does not loop). Relies on the `buttonShine` keyframe in index.css.
 */
const ShineButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button ref={ref} className={cn('group relative overflow-hidden', className)} {...props}>
      {children}
      <ShineSweep />
    </button>
  )
);
ShineButton.displayName = 'ShineButton';

/**
 * Non-button variant of the same shine sweep, for wrapping elements that
 * already contain interactive children (e.g. a pill with two nested
 * buttons) where a <button> wrapper would be invalid HTML.
 */
const ShineBox = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('group relative overflow-hidden', className)} {...props}>
      {children}
      <ShineSweep />
    </div>
  )
);
ShineBox.displayName = 'ShineBox';

export { ShineButton, ShineBox };
