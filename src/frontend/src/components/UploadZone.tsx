import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadFile } from "../hooks/useQueries";

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadFile(setUploadProgress);

  const processFile = useCallback(
    async (file: File) => {
      setUploadingName(file.name);
      setUploadProgress(0);
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        await uploadMutation.mutateAsync({ file, bytes });
        toast.success(`"${file.name}" uploaded!`);
      } catch {
        toast.error(`Failed to upload "${file.name}".`);
      } finally {
        setUploadingName("");
        setUploadProgress(0);
      }
    },
    [uploadMutation],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div
      data-ocid="upload.dropzone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-label="Choose file to upload"
      />

      <div className="flex flex-col items-center justify-center gap-3 py-8 px-6 text-center">
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              data-ocid="upload.loading_state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium text-sm">Uploading…</span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[200px] mx-auto">
                {uploadingName}
              </p>
              <Progress
                value={uploadProgress}
                className="h-2 w-full max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(uploadProgress)}%
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Drop a file here
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  or click to browse your files
                </p>
              </div>
              <Button
                data-ocid="upload.upload_button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
