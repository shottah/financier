export interface AccountInfo {
  accountNumberLast4: string;
  statementPeriod: {
    start: string;
    end: string;
  };
  openingBalance: number;
  closingBalance: number;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

export interface ProcessedStatement {
  accountInfo: AccountInfo;
  transactions: Transaction[];
}