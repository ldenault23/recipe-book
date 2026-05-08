'use client';

import { UnitProvider } from '@/lib/UnitContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <UnitProvider>{children}</UnitProvider>;
}
