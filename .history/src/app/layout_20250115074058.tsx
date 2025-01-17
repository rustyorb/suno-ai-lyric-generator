import "./globals.css";

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

  return (
    <html lang="en">
      <body>
        {/* Add env prop to a script tag that client components can access */}
        <script
          id="env-script"
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
