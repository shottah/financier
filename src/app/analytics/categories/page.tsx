import { Metadata } from 'next'
import CategoriesContent from './categories-content'

export const metadata: Metadata = {
  title: 'Categories - Analytics | Bank Statement Analyzer',
  description: 'Detailed breakdown of spending by category',
}

export default function CategoriesPage() {
  return <CategoriesContent />
}