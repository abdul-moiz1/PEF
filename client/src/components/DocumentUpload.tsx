import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  description?: string;
}

export function DocumentUpload({ value, onChange, label, description }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image, PDF, or Word document",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "Please log in to upload documents",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const token = await currentUser.getIdToken();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      
      if (!data.success || !data.url) {
        throw new Error("Upload succeeded but no URL returned");
      }

      setFileName(file.name);
      onChange(data.url);

      toast({
        title: "Upload successful",
        description: "Document has been uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    onChange(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleChange}
        disabled={uploading}
        data-testid="input-document-upload"
      />
      
      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <FileText className="w-5 h-5 text-primary" />
          <span className="flex-1 text-sm truncate">{fileName || "Document uploaded"}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            data-testid="button-clear-document"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={uploading}
          className="w-full"
          data-testid="button-upload-document"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      )}
      
      <p className="text-xs text-muted-foreground">
        Accepted formats: Images, PDF, Word documents (max 10MB)
      </p>
    </div>
  );
}
