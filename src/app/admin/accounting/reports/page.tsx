'use client'

import React from 'react'
import useAdminStore from '@/store/adminStore'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'

interface MonthlyData {
  month: number
  revenue: number
  expenses: number
  refunds: number
}

interface AccountingSummary {
  totalRevenue: number
  totalExpenses: number
  totalRefunds: number
  netProfit: number
}

const AdminReportsPage = () => {
  const { isLoading } = useAdminStore()
  const [selectedPeriod, setSelectedPeriod] = React.useState('year')
  const [summary, setSummary] = React.useState<AccountingSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalRefunds: 0,
    netProfit: 0
  })
  const [monthlyData, setMonthlyData] = React.useState<MonthlyData[]>([])

  React.useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      const response = await fetch('/api/admin/accounting/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSummary(data.data.summary)
          setMonthlyData(data.data.monthlyData || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getMonthName = (monthNumber: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    return months[monthNumber - 1] || ''
  }

  const calculateGrowth = () => {
    if (monthlyData.length < 2) return 0
    
    const currentMonth = monthlyData[monthlyData.length - 1]
    const previousMonth = monthlyData[monthlyData.length - 2]
    
    if (!previousMonth || previousMonth.revenue === 0) return 0
    
    return ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
  }

  const getTopCategories = () => {
    // Mock data for demonstration - in real implementation, this would come from API
    return [
      { category: 'Sales', amount: summary.totalRevenue * 0.8, percentage: 80 },
      { category: 'Subscriptions', amount: summary.totalRevenue * 0.15, percentage: 15 },
      { category: 'Other', amount: summary.totalRevenue * 0.05, percentage: 5 }
    ]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const growth = calculateGrowth()
  const topCategories = getTopCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-600">
            Detailed analytics and financial insights
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button
            onClick={fetchFinancialData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
              <div className={`flex items-center space-x-1 mt-2 text-sm ${
                growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                <span>{Math.abs(growth).toFixed(1)}% vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpenses)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {summary.totalRevenue > 0 ? ((summary.totalExpenses / summary.totalRevenue) * 100).toFixed(1) : 0}% of revenue
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold ${
                summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.netProfit)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {summary.totalRevenue > 0 ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : 0}% margin
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              summary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRefunds)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {summary.totalRevenue > 0 ? ((summary.totalRefunds / summary.totalRevenue) * 100).toFixed(1) : 0}% refund rate
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowDownLeft className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {monthlyData.slice(-6).map((month: MonthlyData) => {
              const maxRevenue = Math.max(...monthlyData.map((m: MonthlyData) => m.revenue))
              const widthPercentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
              
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      {getMonthName(month.month)}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(month.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${widthPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {topCategories.map((category, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500']
              const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100']
              
              return (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                    <span className="text-sm font-medium text-gray-600">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(category.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.percentage}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Monthly Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Financial Breakdown</h2>
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refunds
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((month: MonthlyData) => {
                const netProfit = month.revenue - month.expenses - month.refunds
                const margin = month.revenue > 0 ? (netProfit / month.revenue) * 100 : 0
                
                return (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getMonthName(month.month)} 2024
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(month.revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(month.expenses)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-orange-600">
                        {formatCurrency(month.refunds)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(netProfit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        margin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {margin.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {monthlyData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No financial data available</h3>
            <p className="text-gray-500">
              Financial reports will appear here once transactions are recorded
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminReportsPage