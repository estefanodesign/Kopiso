'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import useAdminStore from '@/store/adminStore'
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle
} from 'lucide-react'
import { Transaction } from '@/types'
import toast from 'react-hot-toast'

const AdminAccountingPage = () => {
  const { 
    transactions, 
    fetchTransactions, 
    addTransaction, 
    deleteTransaction, 
    isLoading 
  } = useAdminStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [accountingSummary, setAccountingSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalRefunds: 0,
    netProfit: 0
  })

  const [newTransaction, setNewTransaction] = useState({
    type: 'revenue' as 'revenue' | 'expense' | 'refund',
    amount: '',
    description: '',
    category: '',
    reference: ''
  })

  const itemsPerPage = 15

  useEffect(() => {
    fetchTransactions()
    fetchAccountingSummary()
  }, [fetchTransactions])

  const fetchAccountingSummary = async () => {
    try {
      const response = await fetch('/api/admin/accounting/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAccountingSummary(data.data.summary)
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounting summary:', error)
    }
  }

  const filteredTransactions = transactions
    .filter((transaction: Transaction) => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
      return matchesSearch && matchesType && matchesCategory
    })
    .sort((a: Transaction, b: Transaction) => {
      let aValue: any = sortBy === 'date' ? new Date(a.date).getTime() : a[sortBy as keyof Transaction]
      let bValue: any = sortBy === 'date' ? new Date(b.date).getTime() : b[sortBy as keyof Transaction]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  const getTransactionConfig = (type: Transaction['type']) => {
    switch (type) {
      case 'revenue':
        return { color: 'bg-green-100 text-green-800', icon: ArrowUpRight, text: 'Revenue' }
      case 'expense':
        return { color: 'bg-red-100 text-red-800', icon: ArrowDownLeft, text: 'Expense' }
      case 'refund':
        return { color: 'bg-orange-100 text-orange-800', icon: ArrowDownLeft, text: 'Refund' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: FileText, text: type }
    }
  }

  const getUniqueCategories = () => {
    const categories = transactions.map((t: Transaction) => t.category).filter(Boolean)
    return Array.from(new Set(categories))
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await addTransaction({
        type: newTransaction.type,
        amount,
        description: newTransaction.description,
        category: newTransaction.category,
        reference: newTransaction.reference || undefined,
        date: new Date().toISOString()
      })
      
      setShowAddModal(false)
      setNewTransaction({ type: 'revenue', amount: '', description: '', category: '', reference: '' })
      fetchAccountingSummary()
    } catch (error) {
      toast.error('Failed to add transaction')
    }
  }

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      await deleteTransaction(transactionToDelete.id)
      setShowDeleteModal(false)
      setTransactionToDelete(null)
      fetchAccountingSummary()
    } catch (error) {
      toast.error('Failed to delete transaction')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting & Finance</h1>
          <p className="text-sm text-gray-600">Track transactions and view financial reports</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTransactions()}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(accountingSummary.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(accountingSummary.totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(accountingSummary.totalRefunds)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                accountingSummary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  accountingSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold ${
                accountingSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(accountingSummary.netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
            <option value="refund">Refund</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="type">Type</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{filteredTransactions.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.map((transaction: Transaction) => {
                const config = getTransactionConfig(transaction.type)
                const Icon = config.icon
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${
                        transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{formatDate(transaction.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {transaction.orderId && (
                          <Link
                            href={`/admin/orders/${transaction.orderId}`}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View Order"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        {!transaction.orderId && (
                          <button
                            onClick={() => {
                              setTransactionToDelete(transaction)
                              setShowDeleteModal(true)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete Transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Transactions will appear here as they are created'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Add Transaction</h3>
                <p className="text-sm text-gray-500">Create a new financial transaction</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type *</label>
                <select
                  value={newTransaction.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTransaction((prev: any) => ({ ...prev, type: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                  <option value="refund">Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTransaction.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransaction((prev: any) => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransaction((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter transaction description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <input
                  type="text"
                  value={newTransaction.category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransaction((prev: any) => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., sales, marketing, office supplies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                <input
                  type="text"
                  value={newTransaction.reference}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransaction((prev: any) => ({ ...prev, reference: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Invoice number, receipt, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Transaction</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the transaction "<strong>{transactionToDelete.description}</strong>"?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAccountingPage