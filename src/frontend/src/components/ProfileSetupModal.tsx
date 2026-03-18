import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
  onDone: () => void;
}

export default function ProfileSetupModal({
  open,
  onDone,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveMutation = useSaveProfile();

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await saveMutation.mutateAsync({ name: name.trim() });
      toast.success("Welcome to FamilyShare! 🎉");
      onDone();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        data-ocid="profile.dialog"
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl mb-2 text-center"
          >
            👋
          </motion.div>
          <DialogTitle className="font-display text-2xl text-center">
            Welcome!
          </DialogTitle>
          <DialogDescription className="text-center">
            What should we call you? This helps your friends and family know
            who's sharing files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Your name</Label>
            <Input
              id="display-name"
              data-ocid="profile.input"
              placeholder="e.g. Grandma Rose"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <Button
            data-ocid="profile.submit_button"
            className="w-full"
            onClick={handleSave}
            disabled={!name.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…
              </>
            ) : (
              "Get Started →"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
