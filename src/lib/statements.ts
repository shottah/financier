import { Statement } from '@prisma/client'

/**
 * Get the URL to download/view a statement
 * @param statement The statement object from the database
 * @returns The URL to access the statement PDF
 */
export function getStatementUrl(statement: Statement | { filePath: string; blobUrl: string | null }): string {
  // Prefer blobUrl if available (new uploads)
  if (statement.blobUrl) {
    return statement.blobUrl
  }
  
  // Fallback to filePath
  // If it's already a full URL (blob URL), return as-is
  if (statement.filePath.startsWith('http')) {
    return statement.filePath
  }
  
  // For local files, use the download API endpoint
  // This provides better security and control
  if ('id' in statement) {
    return `/api/statements/${statement.id}/download`
  }
  
  // Fallback (shouldn't happen in practice)
  return statement.filePath
}

/**
 * Check if a statement is stored in blob storage
 */
export function isStoredInBlob(statement: Statement | { filePath: string; blobUrl: string | null }): boolean {
  return !!(statement.blobUrl || statement.filePath.startsWith('http'))
}

/**
 * Get display info for a statement file
 */
export function getStatementFileInfo(statement: Statement) {
  const isBlob = isStoredInBlob(statement)
  
  return {
    name: statement.fileName,
    size: statement.fileSize,
    sizeFormatted: statement.fileSize ? formatFileSize(statement.fileSize) : 'Unknown',
    type: statement.mimeType || 'application/pdf',
    storageType: isBlob ? 'cloud' : 'local',
    url: getStatementUrl(statement),
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}