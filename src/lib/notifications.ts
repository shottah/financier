import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CreateNotificationParams {
  userId?: string
  type: 'success' | 'error' | 'info'
  title: string
  description: string
  metadata?: any
}

export async function createNotification({
  userId = 'default-user',
  type,
  title,
  description,
  metadata,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

// Helper function to notify statement processing completion
export async function notifyStatementProcessed({
  statementId,
  cardName,
  cardLastFour,
  success = true,
  error = null,
  userId = 'default-user',
}: {
  statementId: string
  cardName: string
  cardLastFour?: string
  success: boolean
  error?: string | null
  userId?: string
}) {
  const cardDisplay = cardLastFour ? `${cardName} (•••• ${cardLastFour})` : cardName
  
  if (success) {
    return createNotification({
      userId,
      type: 'success',
      title: 'Statement Processed',
      description: `Your statement for ${cardDisplay} has been processed successfully`,
      metadata: { statementId, cardName },
    })
  } else {
    return createNotification({
      userId,
      type: 'error',
      title: 'Processing Failed',
      description: `Failed to process statement for ${cardDisplay}. ${error || 'Please try again.'}`,
      metadata: { statementId, cardName, error },
    })
  }
}

// Helper function to notify when a new statement is uploaded
export async function notifyStatementUploaded({
  statementId,
  cardName,
  cardLastFour,
  userId = 'default-user',
}: {
  statementId: string
  cardName: string
  cardLastFour?: string
  userId?: string
}) {
  const cardDisplay = cardLastFour ? `${cardName} (•••• ${cardLastFour})` : cardName
  
  return createNotification({
    userId,
    type: 'info',
    title: 'Statement Uploaded',
    description: `New statement uploaded for ${cardDisplay}. Processing will begin shortly.`,
    metadata: { statementId, cardName },
  })
}