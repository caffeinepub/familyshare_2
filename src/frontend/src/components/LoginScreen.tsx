import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FILE_EMOJIS = [
  { key: "photos", emoji: "📸" },
  { key: "videos", emoji: "🎬" },
  { key: "docs", emoji: "📄" },
  { key: "music", emoji: "🎵" },
  { key: "spreadsheets", emoji: "📊" },
  { key: "archives", emoji: "🗜️" },
];

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 text-center max-w-sm"
      >
        <div className="text-7xl">🏠</div>
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">
            FamilyShare
          </h1>
          <p className="mt-2 text-muted-foreground">
            A safe place to share photos, videos, and files with the people you
            love.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="grid grid-cols-3 gap-3 text-3xl">
            {FILE_EMOJIS.map(({ key, emoji }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center justify-center h-14 rounded-xl bg-card border border-border shadow-xs"
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </div>

        <Button
          data-ocid="login.primary_button"
          size="lg"
          className="w-full text-base"
          onClick={login}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Connecting…" : "Sign in to get started"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Secure, private, and built on the Internet Computer.
        </p>
      </motion.div>
    </div>
  );
}
