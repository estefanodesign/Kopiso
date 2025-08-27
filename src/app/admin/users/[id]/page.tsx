'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useAdminStore from '@/store/adminStore'
import { 
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  User,
  Edit,
  AlertCircle,
  CheckCircle,
  XCircle,
  Crown,
  FileText,
  Eye,
  TrendingUp,
  Package,
  Clock,
  Copy
} from 'lucide-react'
import { User as UserType } from '@/types'
import toast from 'react-hot-toast'

interface UserDetailPageProps {
  params: {
    id: string
  }
}

const UserDetailPage = ({ params }: UserDetailPageProps) => {
  const router = useRouter()
  const { users, fetchUsers, updateUserRole, deleteUser } = useAdminStore()

  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [newRole, setNewRole] = useState<'customer' | 'admin'>('customer')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const loadUser = () => {
      const foundUser = users.find(u => u.id === params.id)
      if (foundUser) {
        setUser(foundUser)
        setNewRole(foundUser.role)
        setLoading(false)
      } else if (users.length > 0) {
        // User not found
        toast.error('User not found')
        router.push('/admin/users')
      }
    }

    if (users.length === 0) {
      fetchUsers().then(() => {
        loadUser()
      })
    } else {
      loadUser()
    }
  }, [params.id, users, fetchUsers, router])

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'text-purple-600 bg-purple-100', icon: Crown, text: 'Admin' }
      case 'customer':
        return { color: 'text-blue-600 bg-blue-100', icon: User, text: 'Customer' }
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: User, text: role }
    }
  }

  const getStatusConfig = (isActive: boolean) => {
    if (isActive !== false) {
      return { color: 'text-green-600 bg-green-100', icon: CheckCircle, text: 'Active' }
    } else {
      return { color: 'text-red-600 bg-red-100', icon: XCircle, text: 'Inactive' }
    }
  }

  const handleRoleUpdate = async () => {
    if (!user || newRole === user.role) {
      setShowRoleModal(false)
      return
    }

    try {
      await updateUserRole(user.id, newRole)
      toast.success(`User role updated to ${newRole}`)
      setShowRoleModal(false)
      
      // Refresh the user data
      await fetchUsers()
    } catch (error) {
      toast.error('Failed to update user role')
    }
  }

  const handleDeleteUser = async () => {
    if (!user) return

    try {
      await deleteUser(user.id)
      toast.success('User deleted successfully!')
      router.push('/admin/users')
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserStats = () => {
    // Mock user statistics (in real implementation, this would come from API)
    return {
      totalOrders: Math.floor(Math.random() * 50),
      totalSpent: Math.floor(Math.random() * 10000),
      averageOrder: Math.floor(Math.random() * 500),
      lastOrderDate: user?.createdAt,
      joinedDaysAgo: Math.floor((new Date().getTime() - new Date(user?.createdAt || '').getTime()) / (1000 * 3600 * 24))
    }
  }

  const getMockOrders = () => {
    // Mock order history (in real implementation, this would come from API)
    return Array.from({ length: 5 }, (_, i) => ({
      id: `order-${i + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      total: Math.floor(Math.random() * 500) + 50,
      status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)],
      items: Math.floor(Math.random() * 5) + 1
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
        <p className="text-gray-500 mb-6">The user you're looking for doesn't exist.</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </Link>
      </div>
    )
  }

  const roleConfig = getRoleConfig(user.role)
  const statusConfig = getStatusConfig(user.isActive !== false)
  const RoleIcon = roleConfig.icon
  const StatusIcon = statusConfig.icon
  const stats = getUserStats()
  const mockOrders = getMockOrders()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-600">
              Joined on {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Shield className="h-4 w-4" />
            <span>Change Role</span>
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Delete User</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{user.name}</p>
                    <button
                      onClick={() => copyToClipboard(user.name)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyToClipboard(user.email)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={`mailto:${user.email}`}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Mail className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {user.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(user.phone)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <a
                          href={`tel:${user.phone}`}
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                    <button
                      onClick={() => copyToClipboard(user.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}>
                    <RoleIcon className="h-4 w-4 mr-2" />
                    {roleConfig.text}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {statusConfig.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link
                href={`/admin/orders?customer=${user.id}`}
                className="text-sm text-primary hover:text-primary-dark flex items-center space-x-1"
              >
                <span>View all orders</span>
                <Eye className="h-4 w-4" />
              </Link>
            </div>
            
            {mockOrders.length > 0 ? (
              <div className="space-y-3">
                {mockOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.id}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ${order.total.toFixed(2)} • {order.items} item(s) • {formatDate(order.date)}
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
                <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No orders found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <span className="font-medium text-gray-900">{stats.totalOrders}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Total Spent</span>
                </div>
                <span className="font-medium text-gray-900">${stats.totalSpent.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Average Order</span>
                </div>
                <span className="font-medium text-gray-900">${stats.averageOrder.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Days as Customer</span>
                </div>
                <span className="font-medium text-gray-900">{stats.joinedDaysAgo}</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Date Joined</span>
                </div>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(user.createdAt)}
                </p>
              </div>

              {user.updatedAt && user.updatedAt !== user.createdAt && (
                <div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Last Updated</span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Account Type</span>
                </div>
                <p className="text-sm text-gray-900 mt-1">
                  {user.role === 'admin' ? 'Administrator Account' : 'Customer Account'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowRoleModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Shield className="h-4 w-4" />
                <span>Change Role</span>
              </button>
              
              <a
                href={`mailto:${user.email}`}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </a>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Delete User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Update Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Update User Role</h3>
                <p className="text-sm text-gray-500">{user.name} ({user.email})</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Role: <span className="font-semibold">{user.role}</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'customer' | 'admin')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<strong>{user.name}</strong>" ({user.email})?
              This will permanently remove their account and all associated data.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
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

export default UserDetailPage