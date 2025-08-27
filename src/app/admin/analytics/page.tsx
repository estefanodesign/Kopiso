'use client'

import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

// Mock data - in a real app, this would come from an API
const mockAnalyticsData = {
  overview: {
    totalRevenue: 125680,
    totalOrders: 1234,
    totalCustomers: 892,
    conversionRate: 3.24
  },
  monthlyRevenue: [
    { month: 'Jan', revenue: 45000, orders: 120 },
    { month: 'Feb', revenue: 52000, orders: 140 },
    { month: 'Mar', revenue: 48000, orders: 130 },
    { month: 'Apr', revenue: 61000, orders: 155 },
    { month: 'May', revenue: 55000, orders: 145 },
    { month: 'Jun', revenue: 67000, orders: 180 }
  ],
  topProducts: [
    { name: 'Premium Arabica Coffee', sales: 245, revenue: 12250 },
    { name: 'Traditional Batik Keychain', sales: 198, revenue: 5940 },
    { name: 'Bold Robusta Coffee', sales: 167, revenue: 8350 },
    { name: 'Miniature Borobudur Temple', sales: 134, revenue: 6700 },
    { name: 'Signature Coffee Blend', sales: 123, revenue: 7380 }
  ]
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState('6months')
  const [data, setData] = React.useState(mockAnalyticsData)

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: {
    title: string
    value: string | number
    icon: React.ElementType
    trend?: 'up' | 'down'
    trendValue?: string
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className="p-3 bg-primary-100 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor your store performance and customer insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="3months">Last 3 months</option>
            <option value="6months">Last 6 months</option>
            <option value="1year">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${data.overview.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="12.5% from last month"
        />
        <StatCard
          title="Total Orders"
          value={data.overview.totalOrders}
          icon={ShoppingCart}
          trend="up"
          trendValue="8.3% from last month"
        />
        <StatCard
          title="Total Customers"
          value={data.overview.totalCustomers}
          icon={Users}
          trend="up"
          trendValue="15.2% from last month"
        />
        <StatCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate}%`}
          icon={TrendingUp}
          trend="down"
          trendValue="2.1% from last month"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.monthlyRevenue.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {item.month}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.revenue / 70000) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    ${item.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.orders} orders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.sales} sales
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    ${product.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">4.8</div>
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="text-xs text-green-600 mt-1">↑ 0.3 from last month</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">2.4</div>
            <div className="text-sm text-gray-600">Average Order Value</div>
            <div className="text-xs text-green-600 mt-1">↑ $0.15 from last month</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">78%</div>
            <div className="text-sm text-gray-600">Customer Retention</div>
            <div className="text-xs text-red-600 mt-1">↓ 2% from last month</div>
          </div>
        </div>
      </div>
    </div>
  )
}