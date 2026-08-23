import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { ApplicationRuntime, bootstrapApplication, Readiness } from "../app/bootstrap";
import { LifecycleController } from "../app/LifecycleController";

export type AppRuntime = ApplicationRuntime;
export type { Readiness };

const RuntimeContext = createContext<AppRuntime | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren<{}>): JSX.Element {
  const [runtime, setRuntime] = useState<AppRuntime>();

  useEffect(() => {
    let mounted = true;
    void bootstrapApplication().then((next) => {
      if (mounted) setRuntime(next);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!runtime) return;
    const lifecycle = new LifecycleController(runtime.service);
    lifecycle.start();
    return () => lifecycle.stop();
  }, [runtime]);

  const value = useMemo(() => runtime, [runtime]);
  return (
    <RuntimeContext.Provider value={value}>
      {children}
    </RuntimeContext.Provider>
  );
}

export function useAppRuntime(): AppRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error("Home Dashboard runtime is still starting.");
  }
  return runtime;
}

export function useOptionalAppRuntime(): AppRuntime | undefined {
  return useContext(RuntimeContext);
}
