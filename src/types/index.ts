export interface Card {
  id: string
  name: string
  type: 'CREDIT' | 'DEBIT'
  lastFour?: string
  color: string
  createdAt: string
  updatedAt: string
  statements?: Statement[]
  creditLimit?: number
  currentBalance?: number
  apr?: string
  issuer?: string
  _count?: {
    statements: number
  }
}

export interface Statement {
  id: string
  cardId: string
  card?: Card
  fileName: string
  filePath: string
  uploadDate: string
  statementDate?: string
  year?: number
  month?: number
  startBalance?: number
  endBalance?: number
  endingBalance?: number  // Alternative name for endBalance
  totalDebit?: number
  totalCredit?: number
  extractedData?: string
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  transactions?: Transaction[]
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  statementId: string
  statement?: Statement
  date: string
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  category?: string
  createdAt: string
  updatedAt: string
}
