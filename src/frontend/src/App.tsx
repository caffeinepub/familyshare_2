import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { FolderHeart, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { FileMetadata } from "./backend.d";
import FileCard from "./components/FileCard";
import LoginScreen from "./components/LoginScreen";
import ProfileSetupModal from "./components/ProfileSetupModal";
import ShareModal from "./components/ShareModal";
import UploadZone from "./components/UploadZone";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useListMyFiles,
  useListSharedWithMe,
} from "./hooks/useQueries";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

function FilesGrid({
  files,
  isLoading,
  showOwner,
  onShare,
}: {
  files: FileMetadata[];
  isLoading: boolean;
  showOwner?: boolean;
  onShare?: (f: FileMetadata) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {SKELETON_KEYS.map((k) => (
          <Skeleton key={k} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <motion.div
        data-ocid="files.empty_state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-16 text-center"
      >
        <span className="text-5xl">{showOwner ? "📬" : "📂"}</span>
        <h3 className="font-semibold text-foreground">
          {showOwner ? "Nothing shared with you yet" : "No files uploaded yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {showOwner
            ? "When friends or family share files with you, they'll appear here."
            : "Upload your first file using the area above."}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file, i) => (
        <FileCard
          key={file.id}
          file={file}
          index={i}
          showOwner={showOwner}
          onShare={onShare}
        />
      ))}
    </div>
  );
}

export default function App() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [shareTarget, setShareTarget] = useState<FileMetadata | null>(null);

  const myFilesQuery = useListMyFiles();
  const sharedQuery = useListSharedWithMe();
  const profileQuery = useGetCallerUserProfile();

  const userProfile = profileQuery.data;
  const showProfileSetup =
    isAuthenticated &&
    !profileQuery.isLoading &&
    profileQuery.isFetched &&
    userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (!isAuthenticated && loginStatus !== "logging-in") {
    return (
      <>
        <LoginScreen />
        <Toaster richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster richColors />

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        open={showProfileSetup}
        onDone={() => profileQuery.refetch()}
      />

      {/* Share Modal */}
      <ShareModal
        file={shareTarget}
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderHeart className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold">
              FamilyShare
            </span>
          </div>

          <div className="flex items-center gap-3">
            {profileQuery.isLoading ? (
              <Skeleton className="h-9 w-28 rounded-full" />
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {userProfile?.name && (
                  <span className="text-sm font-medium hidden sm:block">
                    {userProfile.name}
                  </span>
                )}
              </div>
            )}
            <Button
              data-ocid="nav.logout_button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="my-files" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="w-fit">
              <TabsTrigger data-ocid="files.tab" value="my-files">
                My Files
              </TabsTrigger>
              <TabsTrigger data-ocid="shared.tab" value="shared">
                Shared With Me
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-files" className="space-y-6 mt-0">
            <UploadZone />
            <FilesGrid
              files={myFilesQuery.data ?? []}
              isLoading={myFilesQuery.isLoading}
              onShare={(f) => setShareTarget(f)}
            />
          </TabsContent>

          <TabsContent value="shared" className="mt-0">
            <FilesGrid
              files={sharedQuery.data ?? []}
              isLoading={sharedQuery.isLoading}
              showOwner
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
