import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Folder,
  FolderHeart,
  LogOut,
  UserCircle,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "./backend.d";
import FileCard from "./components/FileCard";
import GroupsSection from "./components/GroupsSection";
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

type NavSection = "my-files" | "shared" | "groups" | "account";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: "my-files", label: "My Files", icon: <Folder className="h-5 w-5" /> },
  {
    id: "shared",
    label: "Shared With Me",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "groups",
    label: "Groups",
    icon: <Users className="h-5 w-5" />,
  },
  { id: "account", label: "Account", icon: <UserCircle className="h-5 w-5" /> },
];

function PrincipalIdBanner({ principalText }: { principalText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(principalText);
    setCopied(true);
    toast.success("Principal ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Your Principal ID
        </p>
        <p className="text-sm font-mono text-foreground break-all">
          {principalText}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="shrink-0 gap-1.5"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

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

function SectionLabel({ section }: { section: NavSection }) {
  if (section === "my-files") return <>My Files</>;
  if (section === "shared") return <>Shared With Me</>;
  if (section === "groups") return <>Groups</>;
  return <>Account</>;
}

export default function App() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [activeSection, setActiveSection] = useState<NavSection>("my-files");
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

  const principalText = identity?.getPrincipal().toText() ?? "";

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
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <Toaster richColors />

      <ProfileSetupModal
        open={showProfileSetup}
        onDone={() => profileQuery.refetch()}
      />

      <ShareModal
        file={shareTarget}
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
      />

      {/* Top Header */}
      <header className="shrink-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderHeart className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-lg font-semibold leading-none">
              FamilyShare
            </span>
          </div>

          {/* Section title — center on mobile */}
          <span className="text-sm font-medium text-muted-foreground md:hidden">
            <SectionLabel section={activeSection} />
          </span>

          {/* Avatar */}
          <div className="flex items-center gap-2 ml-auto">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profileQuery.isLoading ? (
              <Skeleton className="h-4 w-20 hidden sm:block" />
            ) : (
              userProfile?.name && (
                <span className="text-sm font-medium hidden sm:block">
                  {userProfile.name}
                </span>
              )
            )}
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — desktop only */}
        <aside
          data-ocid="nav.panel"
          className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar"
        >
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="shrink-0 px-3 py-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {profileQuery.isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <p className="text-sm font-medium truncate">
                    {userProfile?.name ?? "You"}
                  </p>
                )}
              </div>
            </div>
            <Button
              data-ocid="nav.logout_button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            <p className="text-xs text-muted-foreground px-1">
              Made by Mohit Raj
            </p>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-5 max-w-5xl mx-auto space-y-5 pb-24 md:pb-6"
          >
            {activeSection === "my-files" && (
              <>
                <h2 className="hidden md:block text-xl font-display font-semibold">
                  My Files
                </h2>
                {principalText && (
                  <PrincipalIdBanner principalText={principalText} />
                )}
                <UploadZone />
                <FilesGrid
                  files={myFilesQuery.data ?? []}
                  isLoading={myFilesQuery.isLoading}
                  onShare={(f) => setShareTarget(f)}
                />
              </>
            )}

            {activeSection === "shared" && (
              <>
                <h2 className="hidden md:block text-xl font-display font-semibold">
                  Shared With Me
                </h2>
                {principalText && (
                  <PrincipalIdBanner principalText={principalText} />
                )}
                <FilesGrid
                  files={sharedQuery.data ?? []}
                  isLoading={sharedQuery.isLoading}
                  showOwner
                />
              </>
            )}

            {activeSection === "groups" && (
              <GroupsSection
                principalId={principalText || null}
                onShareFile={(f) => setShareTarget(f)}
              />
            )}

            {activeSection === "account" && (
              <AccountSection
                initials={initials}
                userProfile={userProfile}
                profileLoading={profileQuery.isLoading}
                principalText={principalText}
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </main>
      </div>

      {/* Bottom Nav — mobile only */}
      <nav
        data-ocid="nav.bottom_panel"
        className="md:hidden shrink-0 flex items-stretch border-t border-border bg-card/95 backdrop-blur-sm z-40"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            data-ocid={`nav.${item.id}.tab`}
            type="button"
            onClick={() => setActiveSection(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              activeSection === item.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <span
              className={`transition-transform ${
                activeSection === item.id ? "scale-110" : ""
              }`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function AccountSection({
  initials,
  userProfile,
  profileLoading,
  principalText,
  onLogout,
}: {
  initials: string;
  userProfile: { name: string } | null | undefined;
  profileLoading: boolean;
  principalText: string;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="hidden md:block text-xl font-display font-semibold">
        Account
      </h2>

      {/* Profile card */}
      <div className="flex flex-col items-center gap-4 py-8 rounded-2xl bg-card border border-border shadow-card">
        <Avatar className="h-20 w-20 border-4 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {profileLoading ? (
          <Skeleton className="h-6 w-32" />
        ) : (
          <div className="text-center">
            <h3 className="font-display text-2xl font-semibold">
              {userProfile?.name ?? "Your Account"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              FamilyShare member
            </p>
          </div>
        )}
      </div>

      {/* Principal ID */}
      {principalText && <PrincipalIdBanner principalText={principalText} />}

      {/* Sign out */}
      <Button
        data-ocid="account.logout_button"
        variant="outline"
        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Made by Mohit Raj
      </p>
    </div>
  );
}
