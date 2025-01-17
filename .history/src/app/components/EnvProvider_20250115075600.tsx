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
      try {
        // Initialize window.ENV if it doesn't exist
        if (!(window as any).ENV) {
          (window as any).ENV = {};
        }

        // Log the current state
        console.log("EnvProvider: Current window.ENV:", (window as any).ENV);
        console.log("EnvProvider: New env values:", env);

        // Update window.ENV with new values
        Object.assign((window as any).ENV, env);

        // Log the updated state
        console.log("EnvProvider: Updated window.ENV:", (window as any).ENV);

        // Verify environment variables
        const envVars = {
          OPENROUTER_KEY: (window as any).ENV?.NEXT_PUBLIC_OPENROUTER_API_KEY,
          OPENAI_KEY: (window as any).ENV?.NEXT_PUBLIC_OPENAI_API_KEY,
        };
        console.log("EnvProvider: Environment variables status:", {
          OPENROUTER: envVars.OPENROUTER_KEY ? "SET" : "NOT SET",
          OPENAI: envVars.OPENAI_KEY ? "SET" : "NOT SET",
        });
      } catch (error) {
        console.error("EnvProvider: Error initializing environment:", error);
      }
    }
  }, [env]);

  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}
