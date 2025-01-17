import "./globals.css";
import { EnvProvider } from "./components/EnvProvider";

export const metadata = {
  title: "Suno AI Lyric Generator",
  description: "Generate song lyrics using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pass environment variables to client components
  const env = {
    NEXT_PUBLIC_OPENROUTER_API_KEY:
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "",
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  };

  // Log server-side environment variables
  console.log("Server-side environment variables:", {
    OPENROUTER: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? "SET" : "NOT SET",
    OPENAI: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? "SET" : "NOT SET",
  });

  // Create a script that will run before React hydration
  const envScript = `
    window.ENV = ${JSON.stringify(env)};
    console.log('Environment variables loaded:', window.ENV);
    // Add error handling for script execution
    window.onerror = function(msg, url, line) {
      console.error('Script error:', { msg, url, line });
      return false;
    };
  `;

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: envScript }}
          id="env-script"
        />
      </head>
      <body>
        <EnvProvider env={env}>{children}</EnvProvider>
      </body>
    </html>
  );
}
