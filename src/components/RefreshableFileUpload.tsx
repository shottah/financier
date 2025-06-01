'use client'

import { useRouter } from 'next/navigation'

import { FileUpload } from './FileUpload'

interface RefreshableFileUploadProps {
  cardId: string
}

export function RefreshableFileUpload({ cardId }: RefreshableFileUploadProps) {
  const router = useRouter()
  
  const handleUploadComplete = async () => {
    // Refresh the page data after upload completes
    router.refresh()
  }
  
  return (
    <FileUpload cardId={cardId} onUploadComplete={handleUploadComplete} />
  )
}