'use client'

import { Upload, FileText, AlertCircle, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  cardId: string
  onUploadComplete?: () => void | Promise<void>
}

export function FileUpload({ cardId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [completedUploads, setCompletedUploads] = useState(0)

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
    setError(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)
    setCompletedUploads(0)
    
    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('cardId', cardId)

        const response = await fetch('/api/statements/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        // Update progress after each successful upload
        const completed = i + 1
        setCompletedUploads(completed)
        setUploadProgress((completed / files.length) * 100)
      }

      setFiles([])
      onUploadComplete?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload files')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setCompletedUploads(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    disabled: uploading,
  })

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-primary mb-4" />
            <p className="text-sm font-medium">Drop your PDFs here</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              Drag & drop bank statements here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to select PDF files
            </p>
          </div>
        )}
      </div>

      {/* Upload Button - Shows when files are selected */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            <Button 
              onClick={uploadFiles} 
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All
                </>
              )}
            </Button>
          </div>
          
          {/* Progress bar and counter - Shows during upload */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Uploading {completedUploads} of {files.length} files
                </span>
                <span className="text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress 
                value={uploadProgress} 
                className="h-2"
              />
            </div>
          )}
        </div>
      )}

      {/* File List - Below the drop zone */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`} 
              className="flex items-center justify-between p-2 bg-blue-50/70 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0 text-gray-600" />
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}