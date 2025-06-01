import { readFile } from 'fs/promises'
import path from 'path'

import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { notifyStatementProcessed } from '@/lib/notifications'

const prisma = new PrismaClient()

// Background processing function
async function processStatementInBackground(
  statementId: string,
  dataBuffer: Buffer,
  fileName: string,
  useAI: boolean = true,
  aiProvider: 'claude' | 'openai' = 'openai',
  forceReprocess: boolean = false
) {
  const { cardAnalysisProcessor } = await import('@/services/card-analysis')
  
  try {
    let processedData
    
    if (useAI) {
      // AI Processing with Claude or OpenAI
      const blob = new Blob([dataBuffer], { type: 'application/pdf' })
      const file = new File([blob], fileName, { type: 'application/pdf' })
      processedData = await cardAnalysisProcessor.processStatement(file, aiProvider, forceReprocess)
    } else {
      // Text extraction and pattern matching
      const pdfParse = require('@/lib/pdf-parse-patch')
      const pdfData = await pdfParse(dataBuffer)
      const text = pdfData.text
      
      // Extract data using regex patterns
      const accountInfo = extractAccountInfo(text)
      const transactions = extractTransactions(text)
      
      processedData = {
        accountInfo,
        transactions,
      }
    }
    
    // Extract data from the processed result
    const { accountInfo, transactions: extractedTransactions } = processedData
    const endDate = new Date(accountInfo.statementPeriod.end + 'T00:00:00.000Z')
    const year = endDate.getFullYear()
    const month = endDate.getMonth() + 1
    const startBalance = accountInfo.openingBalance
    const endBalance = accountInfo.closingBalance
    
    // Transform transactions for database
    const transactions = extractedTransactions.map((tx: any) => ({
      date: new Date(tx.date + 'T00:00:00.000Z'),  // Ensure proper date format
      description: tx.description,
      amount: tx.amount,
      type: tx.type.toUpperCase() as 'DEBIT' | 'CREDIT',
      category: tx.category || null,  // Include category if available
    }))
    
    // Calculate totals
    const totalDebit = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalCredit = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Update statement with extracted data
    await prisma.statement.update({
      where: { id: statementId },
      data: {
        status: 'PROCESSED',
        year,
        month,
        statementDate: new Date(year, month - 1, 1),
        startBalance,
        endBalance,
        totalDebit,
        totalCredit,
      },
    })
    
    // Create transactions
    const transactionData = transactions.map(transaction => ({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      statementId,
    }))
    
    await prisma.transaction.createMany({
      data: transactionData,
    })
    
    // Get statement with card info for the notification
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { card: true },
    })
    
    // Create success notification
    if (statement) {
      await notifyStatementProcessed({
        statementId,
        cardName: statement.card.name,
        cardLastFour: statement.card.lastFour || undefined,
        success: true,
      })
    }
  } catch (error) {
    console.error('Background processing failed:', error)
    
    // Update status to failed
    await prisma.statement.update({
      where: { id: statementId },
      data: { status: 'FAILED' },
    })
    
    // Get statement with card info for the notification
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { card: true },
    })
    
    if (statement) {
      await notifyStatementProcessed({
        statementId,
        cardName: statement.card.name,
        cardLastFour: statement.card.lastFour || undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const useAI = body.useAI !== false // Default to true
    const aiProvider = body.aiProvider || 'openai' // Default to openai
    const isReprocess = body.reprocess || false

    // Get the statement with card info
    const statement = await prisma.statement.findUnique({
      where: { id },
      include: { card: true },
    })

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    // If reprocessing, delete existing transactions
    if (isReprocess && statement.status === 'PROCESSED') {
      await prisma.transaction.deleteMany({
        where: { statementId: id },
      })
    }

    // Update status to processing
    await prisma.statement.update({
      where: { id },
      data: { status: 'PROCESSING' },
    })

    // Read the PDF file
    const filePath = path.join(process.cwd(), 'public', statement.filePath)
    const dataBuffer = await readFile(filePath)

    // Start background processing (non-blocking)
    processStatementInBackground(id, dataBuffer, statement.fileName, useAI, aiProvider, isReprocess)
      .catch(error => {
        console.error('Failed to start background processing:', error)
      })

    // Return immediately with 202 Accepted
    return NextResponse.json(
      { 
        message: 'Statement processing started',
        statementId: id,
        status: 'PROCESSING',
        useAI,
        aiProvider,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('Failed to start processing:', error)
    return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 })
  }
}

// Extract account information from text
function extractAccountInfo(text: string) {
  // Extract account number (last 4 digits) - enhanced patterns
  const accountPatterns = [
    /\*{4,}(\d{4})/,  // Scotiabank format: ************7398
    /Account\s*#?[:\s]*[X*-]*(\d{4})/i,
    /Account\s*Number[:\s]*[X*-]*(\d{4})/i,
    /Account[:\s]+[X*-]*(\d{4})/i,
    /ending\s*[X*-]*(\d{4})/i,
    /\bA\/C[:\s]*[X*-]*(\d{4})/i,
    /Card[:\s]*[X*-]*(\d{4})/i,
  ]
  
  let accountNumberLast4 = '0000'
  for (const pattern of accountPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      accountNumberLast4 = match[1]
      break
    }
  }
  
  // Extract statement period - enhanced patterns
  const periodPatterns = [
    /Statement\s*Period\s*\n?([A-Za-z]+\s*\d{1,2})\s*[-–]\s*([A-Za-z]+\s*\d{1,2},?\s*\n?\d{4})/i, // Scotiabank multi-line format
    /Statement\s*Period[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})\s*[-–to]\s*([A-Za-z]+\s*\d{1,2},?\s*\d{4})/i,
    /Period[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})\s*[-–to]\s*([A-Za-z]+\s*\d{1,2},?\s*\d{4})/i,
    /From[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})\s*[Tt]o[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})/i,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*[-–to]\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  ]
  
  let periodStart, periodEnd
  
  // Special handling for Scotiabank format
  const scotiaPeriod = text.match(/Statement\s*Period\s*\n?([A-Za-z]+\s*\d{1,2})\s*[-–]\s*([A-Za-z]+\s*\d{1,2},\s*\n?\d{4})/i)
  if (scotiaPeriod) {
    // Extract year from the end date
    const endMatch = scotiaPeriod[2].match(/(\d{4})/)
    const year = endMatch ? endMatch[1] : new Date().getFullYear().toString()
    periodStart = parseStatementDate(scotiaPeriod[1] + ', ' + year)
    periodEnd = parseStatementDate(scotiaPeriod[2])
  } else {
    for (const pattern of periodPatterns) {
      const match = text.match(pattern)
      if (match) {
        periodStart = parseStatementDate(match[1])
        periodEnd = parseStatementDate(match[2])
        break
      }
    }
  }
  
  // If no period found, look for single date
  if (!periodStart || !periodEnd) {
    const datePatterns = [
      /Statement\s*Date[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})/i,
      /[Dd]ate[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})/,
      /As\s*of[:\s]*([A-Za-z]+\s*\d{1,2},?\s*\d{4})/i,
      /Month\s*of[:\s]*([A-Za-z]+\s*\d{4})/i,
    ]
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        const statementDate = parseStatementDate(match[1])
        periodEnd = statementDate
        periodStart = new Date(statementDate)
        periodStart.setMonth(periodStart.getMonth() - 1)
        periodStart = periodStart.toISOString().split('T')[0]
        break
      }
    }
  }
  
  // Fallback to current month if still no dates found
  if (!periodStart || !periodEnd) {
    const now = new Date()
    periodEnd = now.toISOString().split('T')[0]
    now.setMonth(now.getMonth() - 1)
    periodStart = now.toISOString().split('T')[0]
  }
  
  // Extract balances - enhanced patterns for Scotiabank
  const balancePatterns = {
    opening: [
      /PREVIOUS\s*BALANCE\s*\$?([\d,]+\.?\d*)/i,  // Scotiabank format
      /(?:Opening|Previous|Beginning|Prior)\s*Balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /Balance\s*Forward[:\s]*\$?([\d,]+\.?\d*)/i,
      /Previous\s*Statement\s*Balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /Balance\s*[Bb]rought\s*[Ff]orward[:\s]*\$?([\d,]+\.?\d*)/i,
    ],
    closing: [
      /NEW\s*BALANCE\s*\$?([\d,]+\.?\d*)/i,  // Scotiabank format
      /(?:Closing|Current|Ending|New)\s*Balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /Balance\s*[Dd]ue[:\s]*\$?([\d,]+\.?\d*)/i,
      /Total\s*Balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /Statement\s*Balance[:\s]*\$?([\d,]+\.?\d*)/i,
    ],
  }
  
  let openingBalance = 0
  for (const pattern of balancePatterns.opening) {
    const match = text.match(pattern)
    if (match && match[1]) {
      openingBalance = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }
  
  let closingBalance = 0
  for (const pattern of balancePatterns.closing) {
    const match = text.match(pattern)
    if (match && match[1]) {
      closingBalance = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }
  
  return {
    accountNumberLast4,
    statementPeriod: {
      start: periodStart,
      end: periodEnd,
    },
    openingBalance,
    closingBalance,
  }
}

// Extract transactions from text
function extractTransactions(text: string) {
  const transactions = []
  
  // Split text into lines for better processing
  const lines = text.split('\n')
  
  // Look for transaction section
  let inTransactionSection = false
  let currentTransaction: any = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Start of transaction section for Scotiabank
    if (line.includes('TRANSACTION') && line.includes('DESCRIPTION') && line.includes('AMOUNT')) {
      inTransactionSection = true
      continue
    }
    
    if (!inTransactionSection) {
      continue
    }
    
    // Check if line matches the exact transaction format:
    // [Date] [Date] [TransactionID] [Description] [(Amount Currency)] $[Balance]
    const fullTransactionPattern = /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d+)\s+(.+?)\s+\(([\d.,]+)\s+(\w+)\)\s+\$(-?[\d,]+\.\d{2})$/
    const fullMatch = line.match(fullTransactionPattern)
    
    if (fullMatch) {
      // This is a complete transaction on one line
      const [, transDate, postDate, refNo, description, amountValue, currency, balance] = fullMatch
      
      transactions.push({
        transDate,
        postDate,
        refNo,
        description: description.trim(),
        amount: parseFloat(amountValue.replace(/,/g, '')),
        currency,
        balance: parseFloat(balance.replace(/,/g, ''))
      })
      currentTransaction = null // Reset for next transaction
    } else {
      // Check if line starts with date pattern (multi-line transaction)
      const datePattern = /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d+)/
      const dateMatch = line.match(datePattern)
      
      if (dateMatch) {
        // Save previous transaction if exists and valid
        if (currentTransaction && currentTransaction.lines.length > 0) {
          const fullText = currentTransaction.lines.join(' ')
          // Look for amount in parentheses and balance
          const amountBalanceMatch = fullText.match(/\(([\d.,]+)\s+(\w+)\)\s+\$(-?[\d,]+\.\d{2})/)
          
          if (amountBalanceMatch) {
            const [, amountValue, currency, balance] = amountBalanceMatch
            currentTransaction.amount = parseFloat(amountValue.replace(/,/g, ''))
            currentTransaction.currency = currency
            currentTransaction.balance = parseFloat(balance.replace(/,/g, ''))
            
            // Extract description (everything before the amount)
            const amountIndex = fullText.indexOf(amountBalanceMatch[0])
            currentTransaction.description = fullText.substring(0, amountIndex).trim()
            
            transactions.push(currentTransaction)
          }
        }
        
        // Start new transaction
        currentTransaction = {
          transDate: dateMatch[1],
          postDate: dateMatch[2],
          refNo: dateMatch[3],
          description: '',
          amount: 0,
          lines: []
        }
        
        // Get remaining part of line
        const remainingLine = line.substring(dateMatch[0].length).trim()
        if (remainingLine) {
          currentTransaction.lines.push(remainingLine)
        }
      } else if (currentTransaction) {
        // Continuation of current transaction
        if (line) {
          currentTransaction.lines.push(line)
        }
      }
    }
  }
  
  // Don't forget the last transaction
  if (currentTransaction && currentTransaction.lines.length > 0) {
    const fullText = currentTransaction.lines.join(' ')
    // Look for amount in parentheses and balance
    const amountBalanceMatch = fullText.match(/\(([\d.,]+)\s+(\w+)\)\s+\$(-?[\d,]+\.\d{2})/)
    
    if (amountBalanceMatch) {
      const [, amountValue, currency, balance] = amountBalanceMatch
      currentTransaction.amount = parseFloat(amountValue.replace(/,/g, ''))
      currentTransaction.currency = currency
      currentTransaction.balance = parseFloat(balance.replace(/,/g, ''))
      
      // Extract description (everything before the amount)
      const amountIndex = fullText.indexOf(amountBalanceMatch[0])
      currentTransaction.description = fullText.substring(0, amountIndex).trim()
      
      transactions.push(currentTransaction)
    }
  }
  
  // Process collected transactions
  return transactions.map(trans => {
    // Use the amount from the transaction (already extracted from parentheses)
    const amount = trans.amount || 0
    
    // Use the description already extracted
    let description = trans.description || trans.lines?.join(' ') || ''
    
    // Clean up description
    description = description
      .replace(/\s+/g, ' ')
      .trim()
    
    // Determine if it's debit or credit based on amount sign
    // In this statement format: positive amounts = debits (money out), negative amounts = credits (money in)
    let type = 'DEBIT'
    if (amount < 0) {
      type = 'CREDIT'
    } else if (description.includes('REFUND') || description.includes('CASHBACK') || description.includes('CASH BACK') || description.includes('REWARD')) {
      type = 'CREDIT'
    }
    
    // Special case: Card payments that appear negative are actually credits (cashback/rewards)
    if (amount < 0 && description.includes('CARD PAYMENT')) {
      type = 'CREDIT'
    }
    
    return {
      date: parseTransactionDate(trans.transDate),
      description,
      amount: Math.abs(amount),
      type,
    }
  }).filter(tx => tx.amount > 0) // Filter out transactions with no amount
}

// Parse statement date strings
function parseStatementDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch (e) {
    // Continue to fallback
  }
  
  // Fallback parsing for specific formats
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const cleanDate = dateStr.toLowerCase().replace(/[,]/g, '')
  
  for (let i = 0; i < monthNames.length; i++) {
    if (cleanDate.includes(monthNames[i])) {
      const parts = cleanDate.split(/\s+/)
      const day = parseInt(parts.find(p => /^\d{1,2}$/.test(p)) || '1')
      const year = parseInt(parts.find(p => /^\d{4}$/.test(p)) || new Date().getFullYear().toString())
      const date = new Date(year, i, day)
      return date.toISOString().split('T')[0]
    }
  }
  
  return new Date().toISOString().split('T')[0]
}

// Parse transaction date strings
function parseTransactionDate(dateStr: string): string {
  // Handle DD-Mon-YYYY format (Scotiabank)
  const monthMatch = dateStr.match(/(\d{2})-([A-Za-z]{3})-(\d{4})/)
  if (monthMatch) {
    const day = parseInt(monthMatch[1])
    const monthStr = monthMatch[2].substring(0, 3).toLowerCase()  // Take first 3 chars only
    const year = parseInt(monthMatch[3])
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const month = monthNames.indexOf(monthStr)
    
    if (month !== -1) {
      const date = new Date(year, month, day)
      return date.toISOString().split('T')[0]
    }
  }
  
  // Handle MM/DD/YYYY or MM-DD-YYYY
  const parts = dateStr.split(/[/-]/)
  if (parts.length === 3) {
    const month = parseInt(parts[0])
    const day = parseInt(parts[1])
    let year = parseInt(parts[2])
    
    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900
    }
    
    const date = new Date(year, month - 1, day)
    return date.toISOString().split('T')[0]
  }
  
  return new Date().toISOString().split('T')[0]
}