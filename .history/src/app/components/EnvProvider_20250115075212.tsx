"use client";

import { createContext, useContext, useEffect } from "react";

interface EnvContextType {
  NEXT_PUBLIC_OPENROUTER_API_KEY: string;
  NEXT_PUBLIC_OPENAI_API_KEY: string;
}

const EnvContext = createContext<EnvContextType>({
  NEXT_PUBLIC_OPENROUTER_API_KEY: "",
  NEXT_PUBLIC_OPENAI_API_KEY: "",
});

export const useEnv = () => useContext(EnvContext);

export function EnvProvider({
  env,
  children,
}: {
  env: EnvContextType;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Make env variables available globally and log for debugging
    if (typeof window !== "undefined") {
      console.log("EnvProvider: Setting window.ENV with:", env);
      (window as any).ENV = env;
      console.log("EnvProvider: window.ENV is now:", (window as any).ENV);
    }
  }, [env]);

  // Log when the provider mounts
  useEffect(() => {
    console.log("EnvProvider mounted with env:", env);
  }, []);

  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}
