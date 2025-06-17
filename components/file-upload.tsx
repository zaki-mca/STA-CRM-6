import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, Upload, FileUp, FilePlus, X, Check, File } from "lucide-react"
import { toast } from "sonner"

interface FileUploadProps {
  apiEndpoint: string
  entityType: string
  onUploadSuccess: (data: any) => void
  allowedFileTypes?: string
}

export function FileUpload({
  apiEndpoint,
  entityType,
  onUploadSuccess,
  allowedFileTypes = ".xls,.xlsx,.csv,.txt"
}: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) {
      return
    }
    
    // Check file size
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
      setError("File size exceeds 5MB limit")
      return
    }

    setFile(selectedFile)
  }

  const resetUpload = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to upload ${entityType}`)
      }

      const data = await response.json()
      
      // Show success message
      toast.success(
        `Successfully uploaded ${data.added} ${entityType}${data.added !== 1 ? "s" : ""}.` + 
        (data.duplicates > 0 ? ` ${data.duplicates} duplicate(s) were skipped.` : "")
      )
      
      // Pass data to parent
      onUploadSuccess(data.data)
      
      // Close dialog and reset
      setIsOpen(false)
      resetUpload()
    } catch (error: any) {
      setError(error.message || `Failed to upload ${entityType}`)
      toast.error(`Upload error: ${error.message || "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <FilePlus className="h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload {entityType} Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">
              Upload a CSV, Excel (.xls/.xlsx), or text file containing {entityType} data.
              <br />
              The file should contain at minimum a "name" column.
            </p>
            
            <div className="grid w-full items-center gap-1.5">
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept={allowedFileTypes}
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={resetUpload}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary">
                <File className="h-4 w-4" />
                <span className="font-medium text-sm truncate">
                  {file.name}
                </span>
                <span className="text-muted-foreground text-xs ml-auto">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="mt-2 text-xs text-muted-foreground">
              <p>File format requirements:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>For CSV/Excel: Include headers (name, description)</li>
                <li>For TXT: One {entityType} name per line</li>
                <li>Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="relative"
          >
            {isUploading ? (
              <>
                <span className="opacity-0">Upload</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 