import { ReactNode } from 'react';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'purple' | 'gray';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}
