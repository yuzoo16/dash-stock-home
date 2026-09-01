import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { DemoStore } from "@/lib/demo-store";

export interface DemoContextValue {
  isDemo: boolean;
  demoStore: DemoStore | null;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  resetDemoData: () => void;
  /** Increment after any store mutation to trigger re-renders */
  bumpVersion: () => void;
  version: number;
}

export const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  // In-memory working data store for the app session.
  const [store, setStore] = useState<DemoStore | null>(() => new DemoStore());
  const [version, setVersion] = useState(0);

  const enterDemoMode = useCallback(() => {
    setStore(new DemoStore());
    setVersion(0);
  }, []);

  const exitDemoMode = useCallback(() => {
    setStore(new DemoStore());
    setVersion(0);
  }, []);

  const resetDemoData = useCallback(() => {
    if (store) {
      store.reset();
      setVersion((v) => v + 1);
    }
  }, [store]);

  const bumpVersion = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo<DemoContextValue>(
    () => ({
      isDemo: store !== null,
      demoStore: store,
      enterDemoMode,
      exitDemoMode,
      resetDemoData,
      bumpVersion,
      version,
    }),
    [store, enterDemoMode, exitDemoMode, resetDemoData, bumpVersion, version],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
