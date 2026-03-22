import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@icp-sdk/core/principal";
import { Loader2, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useListMyGroups,
  useShareFile,
  useShareFileWithGroup,
  useUnshareFile,
  useUnshareFileFromGroup,
} from "../hooks/useQueries";
import { truncatePrincipal } from "../utils/format";

interface ShareModalProps {
  file: FileMetadata | null;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ file, open, onClose }: ShareModalProps) {
  const [principalInput, setPrincipalInput] = useState("");
  const shareMutation = useShareFile();
  const unshareMutation = useUnshareFile();
  const shareWithGroupMutation = useShareFileWithGroup();
  const unshareFromGroupMutation = useUnshareFileFromGroup();

  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toText() ?? null;
  const groupsQuery = useListMyGroups(principalId);
  const groups = groupsQuery.data ?? [];

  const handleShare = async () => {
    if (!file || !principalInput.trim()) return;
    let p: Principal;
    try {
      p = Principal.fromText(principalInput.trim());
    } catch {
      toast.error("Invalid Principal ID. Please check and try again.");
      return;
    }
    try {
      await shareMutation.mutateAsync({ fileId: file.id, principal: p });
      toast.success("File shared successfully!");
      setPrincipalInput("");
    } catch {
      toast.error("Failed to share file. Please try again.");
    }
  };

  const handleUnshare = async (principal: Principal) => {
    if (!file) return;
    try {
      await unshareMutation.mutateAsync({ fileId: file.id, principal });
      toast.success("Access removed.");
    } catch {
      toast.error("Failed to remove access.");
    }
  };

  const handleShareWithGroup = async (groupId: string) => {
    if (!file) return;
    const alreadyShared = file.sharedWithGroups.includes(groupId);
    try {
      if (alreadyShared) {
        await unshareFromGroupMutation.mutateAsync({
          fileId: file.id,
          groupId,
        });
        toast.success("Removed from group.");
      } else {
        await shareWithGroupMutation.mutateAsync({ fileId: file.id, groupId });
        toast.success("Shared with group!");
      }
    } catch {
      toast.error("Failed to update group sharing.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="share.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Share "{file?.name}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="person">
          <TabsList className="w-full">
            <TabsTrigger
              value="person"
              className="flex-1"
              data-ocid="share.person_tab"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              By Person
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className="flex-1"
              data-ocid="share.group_tab"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Share to Group
            </TabsTrigger>
          </TabsList>

          {/* ── Person Tab ── */}
          <TabsContent value="person" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="principal-input">
                Add person by Principal ID
              </Label>
              <div className="flex gap-2">
                <Input
                  id="principal-input"
                  data-ocid="share.input"
                  placeholder="e.g. aaaaa-aa or 2vxsx-fae…"
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleShare()}
                />
                <Button
                  data-ocid="share.submit_button"
                  onClick={handleShare}
                  disabled={!principalInput.trim() || shareMutation.isPending}
                  className="shrink-0"
                >
                  {shareMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="ml-1">Share</span>
                </Button>
              </div>
            </div>

            {file && file.sharedWith.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Currently shared with
                </Label>
                <ul className="space-y-2">
                  {file.sharedWith.map((p, i) => (
                    <li
                      key={p.toString()}
                      data-ocid={`share.item.${i + 1}`}
                      className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {truncatePrincipal(p.toString())}
                      </span>
                      <Button
                        data-ocid={`share.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnshare(p)}
                        disabled={unshareMutation.isPending}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {file && file.sharedWith.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">
                Not shared with anyone yet. Add a Principal ID above to share.
              </p>
            )}
          </TabsContent>

          {/* ── Group Tab ── */}
          <TabsContent value="group" className="mt-4">
            {groupsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Loading groups…
              </p>
            ) : groups.length === 0 ? (
              <div
                data-ocid="share.groups_empty_state"
                className="text-center py-8 space-y-2"
              >
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  You haven't created any groups yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Go to the Groups section to create one.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {groups.map((group, i) => {
                  const isShared =
                    file?.sharedWithGroups.includes(group.id) ?? false;
                  const isPending =
                    shareWithGroupMutation.isPending ||
                    unshareFromGroupMutation.isPending;
                  return (
                    <li
                      key={group.id}
                      data-ocid={`share.group_item.${i + 1}`}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {group.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.members.length} member
                            {group.members.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        data-ocid={`share.group_toggle_button.${i + 1}`}
                        size="sm"
                        variant={isShared ? "destructive" : "default"}
                        onClick={() => handleShareWithGroup(group.id)}
                        disabled={isPending}
                        className="shrink-0 ml-2"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isShared ? (
                          "Remove"
                        ) : (
                          "Share"
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
