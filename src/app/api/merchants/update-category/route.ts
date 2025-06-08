import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import { MerchantService } from '@/services/merchant-service'
import { TransactionService } from '@/services/transaction-service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { merchantId, merchantName, category, name } = await request.json()

    // Support both merchantId (new) and merchantName (legacy) approaches
    if (merchantId) {
      // New approach: Update merchant by ID
      if (!category && !name) {
        return NextResponse.json(
          { error: 'At least one of category or name must be provided' },
          { status: 400 }
        )
      }

      const updatedMerchant = await MerchantService.updateMerchant(
        user.id,
        merchantId,
        { category, name }
      )

      if (!updatedMerchant) {
        return NextResponse.json(
          { error: 'Merchant not found or unauthorized' },
          { status: 404 }
        )
      }

      // Also update all transactions for this merchant if category was changed
      let transactionUpdateResult = null
      if (category) {
        try {
          transactionUpdateResult = await TransactionService.updateTransactionsByMerchant(
            user.id,
            merchantId,
            category
          )
        } catch (error) {
          console.error('Error updating transactions for merchant:', error)
          // Continue even if transaction update fails
        }
      }

      return NextResponse.json({
        success: true,
        merchant: updatedMerchant,
        transactionsUpdated: transactionUpdateResult?.updatedCount || 0,
        message: `Updated merchant: ${updatedMerchant.name}`
      })

    } else if (merchantName) {
      // Legacy approach: Find merchant by billing name and update
      if (!category) {
        return NextResponse.json(
          { error: 'Category is required for legacy updates' },
          { status: 400 }
        )
      }

      // Find merchant by billing name
      const merchant = await db.merchant.findFirst({
        where: {
          userId: user.id,
          billingName: merchantName
        }
      })

      if (merchant) {
        // Update existing merchant
        const updatedMerchant = await MerchantService.updateMerchant(
          user.id,
          merchant.id,
          { category }
        )

        return NextResponse.json({
          success: true,
          merchant: updatedMerchant,
          message: `Updated merchant: ${merchant.name}`
        })
      } else {
        // Legacy fallback: Update transactions directly by description
        const result = await db.transaction.updateMany({
          where: {
            description: merchantName,
            statement: {
              card: {
                userId: user.id
              }
            }
          },
          data: {
            category: category
          }
        })

        return NextResponse.json({
          success: true,
          updatedCount: result.count,
          message: `Updated ${result.count} transactions for merchant: ${merchantName} (legacy mode)`
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Either merchantId or merchantName must be provided' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating merchant:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update merchant' },
      { status: 500 }
    )
  }
}