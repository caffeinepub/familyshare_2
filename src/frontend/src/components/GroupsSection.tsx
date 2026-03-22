import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileMetadata, Group } from "../backend.d";
import {
  useAddGroupMember,
  useCreateGroup,
  useDeleteGroup,
  useGetGroup,
  useListMyFiles,
  useListMyGroups,
  useRemoveGroupMember,
  useUnshareFileFromGroup,
} from "../hooks/useQueries";
import { truncatePrincipal } from "../utils/format";
import FileCard from "./FileCard";

interface GroupsSectionProps {
  principalId: string | null;
  onShareFile: (file: FileMetadata) => void;
}

export default function GroupsSection({
  principalId,
  onShareFile,
}: GroupsSectionProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const groupsQuery = useListMyGroups(principalId);
  const groups = groupsQuery.data ?? [];

  if (selectedGroupId) {
    return (
      <GroupDetail
        groupId={selectedGroupId}
        principalId={principalId}
        onBack={() => setSelectedGroupId(null)}
        onShareFile={onShareFile}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="hidden md:block text-xl font-display font-semibold">
          Groups
        </h2>
        <Button
          data-ocid="groups.create_button"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-2 ml-auto"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {groupsQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          data-ocid="groups.empty_state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <span className="text-5xl">👥</span>
          <h3 className="font-semibold text-foreground">No groups yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Create a group to share files with multiple family members or
            friends at once.
          </p>
          <Button
            data-ocid="groups.create_empty_button"
            onClick={() => setCreateOpen(true)}
            className="mt-2 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create your first group
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, i) => (
            <GroupCard
              key={group.id}
              group={group}
              index={i}
              principalId={principalId}
              onClick={() => setSelectedGroupId(group.id)}
            />
          ))}
        </div>
      )}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

function GroupCard({
  group,
  index,
  principalId,
  onClick,
}: {
  group: Group;
  index: number;
  principalId: string | null;
  onClick: () => void;
}) {
  const isOwner = principalId && group.owner.toString() === principalId;

  return (
    <motion.div
      data-ocid={`groups.item.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{group.name}</h3>
            <p className="text-xs text-muted-foreground">
              {group.members.length} member
              {group.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isOwner && (
          <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {group.members.slice(0, 3).map((m) => (
          <span
            key={m.toString()}
            className="inline-block bg-muted text-muted-foreground text-xs font-mono px-2 py-0.5 rounded-full truncate max-w-[120px]"
          >
            {truncatePrincipal(m.toString())}
          </span>
        ))}
        {group.members.length > 3 && (
          <span className="inline-block bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            +{group.members.length - 3} more
          </span>
        )}
      </div>
    </motion.div>
  );
}

function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const createMutation = useCreateGroup();

  const addMember = () => {
    const text = memberInput.trim();
    if (!text) return;
    try {
      Principal.fromText(text);
      if (!members.includes(text)) {
        setMembers((prev) => [...prev, text]);
      }
      setMemberInput("");
    } catch {
      toast.error("Invalid Principal ID");
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const memberPrincipals = members.map((m) => Principal.fromText(m));
      await createMutation.mutateAsync({
        name: name.trim(),
        members: memberPrincipals,
      });
      toast.success(`Group "${name}" created!`);
      setName("");
      setMembers([]);
      setMemberInput("");
      onClose();
    } catch {
      toast.error("Failed to create group. Please try again.");
    }
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    setName("");
    setMembers([]);
    setMemberInput("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md" data-ocid="groups.create_modal">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              data-ocid="groups.name_input"
              placeholder="e.g. Family, Work Team, Friends..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members (optional)</Label>
            <div className="flex gap-2">
              <Input
                data-ocid="groups.member_input"
                placeholder="Paste Principal ID…"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
              />
              <Button
                data-ocid="groups.add_member_button"
                type="button"
                variant="outline"
                size="sm"
                onClick={addMember}
                className="shrink-0"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {members.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {members.map((m, i) => (
                  <li
                    key={m}
                    data-ocid={`groups.member.item.${i + 1}`}
                    className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {truncatePrincipal(m)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setMembers((prev) => prev.filter((x) => x !== m))
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            data-ocid="groups.create_submit_button"
            onClick={handleCreate}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupDetail({
  groupId,
  principalId,
  onBack,
  onShareFile,
}: {
  groupId: string;
  principalId: string | null;
  onBack: () => void;
  onShareFile: (file: FileMetadata) => void;
}) {
  const groupQuery = useGetGroup(groupId);
  const myFilesQuery = useListMyFiles();
  const addMemberMutation = useAddGroupMember();
  const removeMemberMutation = useRemoveGroupMember();
  const deleteGroupMutation = useDeleteGroup();
  const unshareFromGroupMutation = useUnshareFileFromGroup();

  const [memberInput, setMemberInput] = useState("");

  const group = groupQuery.data;
  const isOwner = principalId && group?.owner.toString() === principalId;

  const groupFiles = (myFilesQuery.data ?? []).filter((f) =>
    f.sharedWithGroups.includes(groupId),
  );

  const handleAddMember = async () => {
    const text = memberInput.trim();
    if (!text) return;
    let p: Principal;
    try {
      p = Principal.fromText(text);
    } catch {
      toast.error("Invalid Principal ID");
      return;
    }
    try {
      await addMemberMutation.mutateAsync({ groupId, member: p });
      toast.success("Member added!");
      setMemberInput("");
    } catch {
      toast.error("Failed to add member.");
    }
  };

  const handleRemoveMember = async (member: Principal) => {
    try {
      await removeMemberMutation.mutateAsync({ groupId, member });
      toast.success("Member removed.");
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
      toast.success(`Group "${group?.name}" deleted.`);
      onBack();
    } catch {
      toast.error("Failed to delete group.");
    }
  };

  const handleUnshareFile = async (fileId: string) => {
    try {
      await unshareFromGroupMutation.mutateAsync({ fileId, groupId });
      toast.success("File removed from group.");
    } catch {
      toast.error("Failed to remove file from group.");
    }
  };

  if (groupQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Group not found.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          data-ocid="groups.back_button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3 ml-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-semibold">
                {group.name}
              </h2>
              {isOwner && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {group.members.length} member
              {group.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Members</h3>
        <ScrollArea className="max-h-60">
          <ul className="space-y-2">
            {group.members.map((member, i) => {
              const memberStr = member.toString();
              const isSelf = principalId === memberStr;
              const isGroupOwner = group.owner.toString() === memberStr;
              return (
                <li
                  key={memberStr}
                  data-ocid={`groups.member.item.${i + 1}`}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {memberStr.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {truncatePrincipal(memberStr)}
                    </span>
                    {isGroupOwner && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 shrink-0"
                      >
                        <Crown className="h-2.5 w-2.5" />
                        Owner
                      </Badge>
                    )}
                    {isSelf && !isGroupOwner && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        You
                      </Badge>
                    )}
                  </div>
                  {isOwner && !isGroupOwner && (
                    <Button
                      data-ocid={`groups.remove_member_button.${i + 1}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removeMemberMutation.isPending}
                      title="Remove member"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>

        {isOwner && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Input
                data-ocid="groups.add_member_input"
                placeholder="Add member by Principal ID…"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                className="text-sm"
              />
              <Button
                data-ocid="groups.add_member_submit_button"
                variant="outline"
                size="sm"
                onClick={handleAddMember}
                disabled={!memberInput.trim() || addMemberMutation.isPending}
                className="shrink-0"
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Files shared with this group */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Files shared with this group</h3>
        {groupFiles.length === 0 ? (
          <div
            data-ocid="groups.files_empty_state"
            className="flex flex-col items-center gap-2 py-10 rounded-xl border border-dashed border-border text-center"
          >
            <span className="text-3xl">📁</span>
            <p className="text-sm text-muted-foreground">
              No files shared with this group yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Go to My Files, open a file's share menu, and choose "Share to
              Group".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupFiles.map((file, i) => (
              <div key={file.id} className="relative group/file">
                <FileCard file={file} index={i} onShare={onShareFile} />
                <Button
                  data-ocid={`groups.unshare_file_button.${i + 1}`}
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover/file:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive"
                  title="Remove from group"
                  onClick={() => handleUnshareFile(file.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone — owner only */}
      {isOwner && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <h3 className="font-semibold text-sm text-destructive">
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground">
            Deleting this group will remove it for all members. Files won't be
            deleted.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-ocid="groups.delete_button"
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="groups.delete_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the group and remove access for
                  all members. Files won't be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="groups.delete_cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="groups.delete_confirm_button"
                  onClick={handleDeleteGroup}
                  disabled={deleteGroupMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteGroupMutation.isPending ? "Deleting…" : "Delete Group"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </motion.div>
  );
}
