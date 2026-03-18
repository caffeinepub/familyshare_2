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
import { Button } from "@/components/ui/button";
import { Download, Share2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { useDeleteFile } from "../hooks/useQueries";
import {
  formatBytes,
  formatTimestamp,
  getFileColor,
  getFileIcon,
  truncatePrincipal,
} from "../utils/format";

interface FileCardProps {
  file: FileMetadata;
  index: number;
  showOwner?: boolean;
  onShare?: (file: FileMetadata) => void;
}

export default function FileCard({
  file,
  index,
  showOwner,
  onShare,
}: FileCardProps) {
  const deleteMutation = useDeleteFile();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(file.id);
      toast.success(`"${file.name}" deleted.`);
    } catch {
      toast.error("Failed to delete file.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    window.open(file.blob.getDirectURL(), "_blank");
  };

  const colorClass = getFileColor(file.mimeType);
  const icon = getFileIcon(file.mimeType);

  return (
    <motion.div
      data-ocid={`files.item.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative flex flex-col rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
    >
      {/* File type header */}
      <div
        className={`flex items-center justify-center h-20 text-4xl ${colorClass} bg-opacity-50`}
      >
        <span role="img" aria-label={file.mimeType}>
          {icon}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3
          className="font-semibold text-sm leading-tight truncate"
          title={file.name}
        >
          {file.name}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatBytes(file.size)}</span>
          <span>·</span>
          <span>{formatTimestamp(file.uploadTimestamp)}</span>
        </div>

        {showOwner && (
          <p className="text-xs text-muted-foreground truncate">
            From: {truncatePrincipal(file.owner.toString())}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <Button
          data-ocid={`files.download_button.${index + 1}`}
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="flex-1 h-8 text-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Download
        </Button>

        {onShare && (
          <Button
            data-ocid={`files.share_button.${index + 1}`}
            variant="ghost"
            size="sm"
            onClick={() => onShare(file)}
            className="h-8 w-8 p-0"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        )}

        {onShare && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-ocid={`files.delete_button.${index + 1}`}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="files.delete_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{file.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The file will be permanently
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="files.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="files.confirm_button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </motion.div>
  );
}
