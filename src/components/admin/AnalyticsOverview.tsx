'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface AnalyticsOverviewProps {
  selectedPeriod: string
  onPeriodChange: (period: string) => void
}

interface MetricData {
  current: number
  previous: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

interface ChartData {
  date: string
  revenue: number
  orders: number
  customers: number
  products: number
}

const AnalyticsOverview = ({ selectedPeriod, onPeriodChange }: AnalyticsOverviewProps) => {
  const [metrics, setMetrics] = useState<{
    revenue: MetricData
    orders: MetricData
    customers: MetricData
    conversion: MetricData
  }>({
    revenue: { current: 0, previous: 0, change: 0, trend: 'neutral' },
    orders: { current: 0, previous: 0, change: 0, trend: 'neutral' },
    customers: { current: 0, previous: 0, change: 0, trend: 'neutral' },
    conversion: { current: 0, previous: 0, change: 0, trend: 'neutral' }
  })
  
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics/overview?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMetrics(data.data.metrics)
          setChartData(data.data.chartData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return DollarSign
      case 'orders':
        return ShoppingCart
      case 'customers':
        return Users
      case 'conversion':
        return TrendingUp
      default:
        return Package
    }
  }

  const metricCards = [
    {
      title: 'Total Revenue',
      key: 'revenue',
      value: formatCurrency(metrics.revenue.current),
      change: metrics.revenue.change,
      trend: metrics.revenue.trend,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      key: 'orders',
      value: metrics.orders.current.toLocaleString(),
      change: metrics.orders.change,
      trend: metrics.orders.trend,
      color: 'bg-blue-500'
    },
    {
      title: 'New Customers',
      key: 'customers',
      value: metrics.customers.current.toLocaleString(),
      change: metrics.customers.change,
      trend: metrics.customers.trend,
      color: 'bg-purple-500'
    },
    {
      title: 'Conversion Rate',
      key: 'conversion',
      value: `${metrics.conversion.current.toFixed(2)}%`,
      change: metrics.conversion.change,
      trend: metrics.conversion.trend,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-sm text-gray-600">Track your business performance and growth</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = getMetricIcon(metric.key)
          const isPositive = metric.change >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown

          return (
            <div key={metric.key} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <div className={`flex items-center space-x-1 mt-2 text-sm ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="h-4 w-4" />
                    <span>{formatPercentage(metric.change)}</span>
                    <span className="text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  {selectedPeriod === '24h' ? 'Hourly' : 
                   selectedPeriod === '7d' ? 'Daily' : 
                   selectedPeriod === '30d' ? 'Daily' : 
                   selectedPeriod === '90d' ? 'Weekly' : 'Monthly'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {chartData.length > 0 ? (
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.map((data, index) => {
                  const maxRevenue = Math.max(...chartData.map(d => d.revenue))
                  const height = Math.max((data.revenue / maxRevenue) * 200, 4)
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-sm"
                        style={{ height: `${height}px` }}
                        title={`${formatCurrency(data.revenue)} on ${new Date(data.date).toLocaleDateString()}`}
                      ></div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        <p className="rotate-45 origin-center">
                          {new Date(data.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Orders Trend</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  {selectedPeriod === '24h' ? 'Hourly' : 
                   selectedPeriod === '7d' ? 'Daily' : 
                   selectedPeriod === '30d' ? 'Daily' : 
                   selectedPeriod === '90d' ? 'Weekly' : 'Monthly'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {chartData.length > 0 ? (
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.map((data, index) => {
                  const maxOrders = Math.max(...chartData.map(d => d.orders))
                  const height = Math.max((data.orders / maxOrders) * 200, 4)
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm"
                        style={{ height: `${height}px` }}
                        title={`${data.orders} orders on ${new Date(data.date).toLocaleDateString()}`}
                      ></div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        <p className="rotate-45 origin-center">
                          {new Date(data.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No orders data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { name: 'Electronics', sales: 45, percentage: 45 },
                { name: 'Clothing', sales: 32, percentage: 32 },
                { name: 'Books', sales: 23, percentage: 23 }
              ].map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-500">{category.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Acquisition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer Acquisition</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { source: 'Organic Search', customers: 156, color: 'bg-green-500' },
                { source: 'Direct', customers: 89, color: 'bg-blue-500' },
                { source: 'Social Media', customers: 67, color: 'bg-purple-500' },
                { source: 'Referral', customers: 34, color: 'bg-orange-500' }
              ].map((source) => (
                <div key={source.source} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{source.source}</span>
                      <span className="text-sm text-gray-600">{source.customers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Order Value</span>
                <span className="text-sm font-medium text-gray-900">$85.32</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cart Abandonment Rate</span>
                <span className="text-sm font-medium text-red-600">23.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer Lifetime Value</span>
                <span className="text-sm font-medium text-gray-900">$245.67</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Return Customer Rate</span>
                <span className="text-sm font-medium text-green-600">34.8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsOverview