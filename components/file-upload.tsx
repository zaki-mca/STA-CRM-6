"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

interface FileUploadProps {
  apiEndpoint: string;
  entityType: string;
  onUploadSuccess: (items: any[]) => void;
}

export function FileUpload({
  apiEndpoint,
  entityType,
  onUploadSuccess,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedExtensions = [".csv", ".xlsx", ".txt"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error("Please upload a CSV, XLSX, or TXT file");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    // Get the correct API URL from environment or default to port 5000
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Replace any existing API URL in the endpoint with the correct one
    const fixedEndpoint = apiEndpoint.replace(/http:\/\/localhost:\d+\/api/, apiUrl);
    
    try {
      console.log(`Uploading to endpoint: ${fixedEndpoint}`);
      const response = await axios.post(fixedEndpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.status === 200) {
        onUploadSuccess(response.data.items || []);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      
      if (error.response?.status === 404) {
        toast.error(
          `API endpoint not found: ${fixedEndpoint}. Ensure the server is running on port 5000 and the route exists.`
        );
      } else {
        toast.error(
          error.response?.data?.message || `Failed to upload ${entityType}s: ${error.message}`
        );
      }
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  return (
    <div>
      <Button
        className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground gap-1"
        disabled={isUploading}
        onClick={() => document.getElementById("fileUpload")?.click()}
      >
        <Upload className="h-4 w-4" />
        {isUploading ? `Uploading ${entityType}s...` : `Import ${entityType}s (CSV/XLSX/TXT)`}
      </Button>
      <input
        type="file"
        id="fileUpload"
        accept=".csv,.xlsx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
} 