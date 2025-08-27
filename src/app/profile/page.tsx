'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useAuthStore from '@/store/authStore'
import useOrderStore from '@/store/orderStore'
import { 
  User,
  Package,
  MapPin,
  CreditCard,
  Settings,
  Heart,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Plus
} from 'lucide-react'
import { Order, Address } from '@/types'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const router = useRouter()
  const { user, isAuthenticated, token, updateProfile } = useAuthStore()
  const { orders, fetchUserOrders, isLoading } = useOrderStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Fetch user orders and addresses
    fetchUserOrders()
    fetchAddresses()
  }, [isAuthenticated, router, fetchUserOrders])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/auth/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAddresses(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          updateProfile(data.data)
          setEditMode(false)
          toast.success('Profile updated successfully!')
        }
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'shipped':
        return 'text-blue-600 bg-blue-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'processing':
        return <Clock className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const sidebarItems = [
    { id: 'overview', label: 'Account Overview', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Address Book', icon: MapPin },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm">
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Account Overview</h2>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>{editMode ? 'Cancel' : 'Edit Profile'}</span>
                    </button>
                  </div>

                  {editMode ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={profileData.dateOfBirth}
                            onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                          </label>
                          <select
                            value={profileData.gender}
                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Full Name</label>
                          <p className="text-lg text-gray-900">{user?.name || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Email Address</label>
                          <p className="text-lg text-gray-900">{user?.email}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                          <p className="text-lg text-gray-900">{user?.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-lg text-gray-900">{user?.dateOfBirth || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Gender</label>
                          <p className="text-lg text-gray-900 capitalize">{user?.gender || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Member Since</label>
                          <p className="text-lg text-gray-900">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading orders...</p>
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order: Order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                {getOrderStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </span>
                              <Link
                                href={`/orders/${order.id}`}
                                className="text-primary hover:text-primary-dark"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Total Amount:</span>
                              <span className="ml-2 text-gray-900">${order.total.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Items:</span>
                              <span className="ml-2 text-gray-900">{order.items.length} item(s)</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Payment:</span>
                              <span className="ml-2 text-gray-900 capitalize">{order.paymentMethod}</span>
                            </div>
                          </div>

                          {order.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-3">
                                <ShoppingBag className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {order.items[0].productName}
                                  {order.items.length > 1 && ` and ${order.items.length - 1} more item(s)`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-500 mb-6">When you place orders, they'll appear here.</p>
                      <Link
                        href="/products"
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Start Shopping</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Address Book</h2>
                    <Link
                      href="/profile/addresses/new"
                      className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Address</span>
                    </Link>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900">{address.type}</h3>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                Default
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium">{address.recipientName}</p>
                            <p>{address.street}</p>
                            <p>{address.city}, {address.state} {address.postalCode}</p>
                            <p>{address.country}</p>
                            {address.phone && <p>Phone: {address.phone}</p>}
                          </div>

                          <div className="mt-4 flex space-x-2">
                            <button className="text-primary hover:text-primary-dark text-sm font-medium">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                      <p className="text-gray-500 mb-6">Add addresses to make checkout faster.</p>
                      <Link
                        href="/profile/addresses/new"
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Address</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Payment methods coming soon</h3>
                    <p className="text-gray-500">This feature will be available in the next update.</p>
                  </div>
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Wishlist coming soon</h3>
                    <p className="text-gray-500">Save your favorite products for later.</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced settings coming soon</h3>
                    <p className="text-gray-500">Manage notifications, privacy, and security settings.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage