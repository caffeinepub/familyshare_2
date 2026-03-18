import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@icp-sdk/core/principal";
import { Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { useShareFile, useUnshareFile } from "../hooks/useQueries";
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="share.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Share "{file?.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal-input">Add person by Principal ID</Label>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
