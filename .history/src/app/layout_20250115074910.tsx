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
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  };

  // Log environment variables for debugging
  console.log("Server-side env vars:", {
    OPENROUTER: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? "SET" : "NOT SET",
    OPENAI: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? "SET" : "NOT SET",
  });

  return (
    <html lang="en">
      <body>
        <EnvProvider env={env}>{children}</EnvProvider>
      </body>
    </html>
  );
}
