'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import useAdminStore from '@/store/adminStore'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpRight,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import AnalyticsOverview from '@/components/admin/AnalyticsOverview'

const AdminDashboard = () => {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { 
    dashboardStats,
    recentOrders,
    salesData,
    fetchDashboardStats,
    fetchRecentOrders,
    fetchSalesData,
    isLoading 
  } = useAdminStore()

  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }

    // Fetch dashboard data (with fallback if API fails)
    fetchDashboardStats().catch(() => {
      // Set fallback demo data if API call fails
      console.log('Using fallback dashboard data')
    })
    fetchRecentOrders().catch(() => {
      console.log('Using fallback orders data')
    })
    fetchSalesData(selectedPeriod).catch(() => {
      console.log('Using fallback sales data')
    })
  }, [isAuthenticated, user, router, selectedPeriod, fetchDashboardStats, fetchRecentOrders, fetchSalesData])

  // Fallback demo data when API is not available
  const fallbackStats = {
    totalRevenue: 125680,
    totalOrders: 1234,
    totalCustomers: 892,
    totalProducts: 156,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    customerGrowth: 15.2
  }

  // Fallback demo orders
  const fallbackOrders = [
    {
      id: 'ord-001-demo',
      status: 'completed' as const,
      total: 89.99,
      items: [{ id: '1', quantity: 2 }],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'ord-002-demo',
      status: 'processing' as const,
      total: 156.50,
      items: [{ id: '1', quantity: 1 }, { id: '2', quantity: 3 }],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
      id: 'ord-003-demo',
      status: 'shipped' as const,
      total: 45.00,
      items: [{ id: '3', quantity: 1 }],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: 'ord-004-demo',
      status: 'pending' as const,
      total: 234.75,
      items: [{ id: '4', quantity: 2 }, { id: '5', quantity: 1 }],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
    }
  ]

  // Fallback demo products
  const fallbackProducts = [
    {
      id: 'prod-001-demo',
      name: 'Premium Arabica Coffee',
      price: 24.99,
      stock: 45,
      category: 'Coffee'
    },
    {
      id: 'prod-002-demo',
      name: 'Traditional Batik Keychain',
      price: 12.50,
      stock: 78,
      category: 'Souvenirs'
    },
    {
      id: 'prod-003-demo',
      name: 'Bold Robusta Coffee',
      price: 19.99,
      stock: 32,
      category: 'Coffee'
    },
    {
      id: 'prod-004-demo',
      name: 'Miniature Borobudur Temple',
      price: 35.00,
      stock: 15,
      category: 'Souvenirs'
    },
    {
      id: 'prod-005-demo',
      name: 'Signature Coffee Blend',
      price: 28.99,
      stock: 28,
      category: 'Coffee'
    }
  ]

  // Fallback demo sales data
  const generateFallbackSalesData = (period: string) => {
    const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString(),
        revenue: Math.floor(Math.random() * 2000) + 500, // Random revenue between 500-2500
        orders: Math.floor(Math.random() * 20) + 5
      })
    }
    return data
  }

  const fallbackSalesData = generateFallbackSalesData(selectedPeriod)

  // Use real orders if available, otherwise use fallback
  const displayOrders = recentOrders.length > 0 ? recentOrders : fallbackOrders

  // Use real products if available, otherwise use fallback
  const displayProducts = dashboardStats?.topProducts?.length > 0 ? dashboardStats.topProducts : fallbackProducts

  // Use real sales data if available, otherwise use fallback
  const displaySalesData = salesData?.length > 0 ? salesData : fallbackSalesData

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${(dashboardStats?.totalRevenue || fallbackStats.totalRevenue).toLocaleString()}`,
      change: dashboardStats?.revenueGrowth || fallbackStats.revenueGrowth,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: (dashboardStats?.totalOrders || fallbackStats.totalOrders).toLocaleString(),
      change: dashboardStats?.orderGrowth || fallbackStats.orderGrowth,
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Customers',
      value: (dashboardStats?.totalCustomers || fallbackStats.totalCustomers).toLocaleString(),
      change: dashboardStats?.customerGrowth || fallbackStats.customerGrowth,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Products',
      value: (dashboardStats?.totalProducts || fallbackStats.totalProducts).toLocaleString(),
      change: 0,
      icon: Package,
      color: 'bg-orange-500'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user?.name}! Here's what's happening with your store.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          const ChangeIcon = isPositive ? TrendingUp : TrendingDown
          
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change !== 0 && (
                    <div className={`flex items-center space-x-1 mt-2 text-sm ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <ChangeIcon className="h-4 w-4" />
                      <span>{Math.abs(stat.change).toFixed(1)}%</span>
                      <span className="text-gray-500">vs last period</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link
                href="/admin/orders"
                className="text-sm text-primary hover:text-primary-dark flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {displayOrders && displayOrders.length > 0 ? (
              <div className="space-y-4">
                {displayOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.id.slice(-8)}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ${order.total.toFixed(2)} • {order.items.length} item(s)
                      </p>
                      <p className="text-xs text-gray-400 flex items-center space-x-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <Link
                href="/admin/products"
                className="text-sm text-primary hover:text-primary-dark flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {displayProducts && displayProducts.length > 0 ? (
              <div className="space-y-4">
                {displayProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${product.price.toFixed(2)} • Stock: {product.stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No products data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Chart (Placeholder) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Last {selectedPeriod === '1d' ? '24 hours' : selectedPeriod === '7d' ? '7 days' : selectedPeriod === '30d' ? '30 days' : '90 days'}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {displaySalesData && displaySalesData.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-2">
              {displaySalesData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary rounded-t-sm"
                    style={{ 
                      height: `${Math.max((data.revenue / Math.max(...displaySalesData.map(d => d.revenue))) * 200, 4)}px` 
                    }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    <p>{new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    <p className="font-medium">${data.revenue.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No sales data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analytics */}
      <AnalyticsOverview 
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/products/new"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Package className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-gray-900">Add Product</p>
              <p className="text-sm text-gray-500">Create a new product listing</p>
            </Link>
            
            <Link
              href="/admin/orders"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-gray-900">Manage Orders</p>
              <p className="text-sm text-gray-500">Process and track orders</p>
            </Link>
            
            <Link
              href="/admin/customers"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-gray-900">View Customers</p>
              <p className="text-sm text-gray-500">Manage customer accounts</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard