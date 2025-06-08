import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import { MerchantService } from '@/services/merchant-service'

// GET /api/merchants - Get all merchants for the user
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    
    const merchants = await MerchantService.getUserMerchants(user.id)
    
    return NextResponse.json({
      merchants,
      count: merchants.length
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch merchants' },
      { status: 500 }
    )
  }
}

// POST /api/merchants - Create new merchant or migrate existing data
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { action, name, billingName, category } = await request.json()
    
    if (action === 'migrate') {
      // Migrate existing transactions to use merchants
      const result = await MerchantService.migrateExistingTransactions(user.id)
      
      return NextResponse.json({
        success: true,
        migration: result,
        message: `Migration completed: ${result.processed} transactions processed, ${result.merchantsCreated} merchants created, ${result.errors} errors`
      })
    } else if (action === 'create') {
      // Create a new merchant manually
      if (!name || !billingName) {
        return NextResponse.json(
          { error: 'Name and billing name are required' },
          { status: 400 }
        )
      }
      
      const merchant = await MerchantService.findOrCreateMerchant(
        user.id,
        billingName,
        category
      )
      
      // Update the name if it's different from billing name
      if (name !== billingName) {
        const updatedMerchant = await MerchantService.updateMerchant(
          user.id,
          merchant.id,
          { name }
        )
        
        return NextResponse.json({
          success: true,
          merchant: updatedMerchant,
          message: `Created merchant: ${name}`
        })
      }
      
      return NextResponse.json({
        success: true,
        merchant,
        message: `Created merchant: ${name}`
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "migrate" or "create"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in merchants POST:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchants - Delete a merchant
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('id')
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      )
    }
    
    const success = await MerchantService.deleteMerchant(user.id, merchantId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Merchant not found or failed to delete' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Merchant deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting merchant:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete merchant' },
      { status: 500 }
    )
  }
}