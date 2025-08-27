'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useAdminStore from '@/store/adminStore'
import { 
  ArrowLeft,
  Edit,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  Copy,
  Eye
} from 'lucide-react'
import { Order } from '@/types'
import toast from 'react-hot-toast'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

const OrderDetailPage = ({ params }: OrderDetailPageProps) => {
  const router = useRouter()
  const { orders, fetchAllOrders, updateOrderStatus, addOrderNote } = useAdminStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<Order['status']>('pending')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    const loadOrder = () => {
      const foundOrder = orders.find(o => o.id === params.id)
      if (foundOrder) {
        setOrder(foundOrder)
        setNewStatus(foundOrder.status)
        setLoading(false)
      } else if (orders.length > 0) {
        // Order not found
        toast.error('Order not found')
        router.push('/admin/orders')
      }
    }

    if (orders.length === 0) {
      fetchAllOrders().then(() => {
        loadOrder()
      })
    } else {
      loadOrder()
    }
  }, [params.id, orders, fetchAllOrders, router])

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600 bg-yellow-100', icon: Clock, text: 'Pending' }
      case 'processing':
        return { color: 'text-blue-600 bg-blue-100', icon: RefreshCw, text: 'Processing' }
      case 'shipped':
        return { color: 'text-purple-600 bg-purple-100', icon: Truck, text: 'Shipped' }
      case 'delivered':
        return { color: 'text-green-600 bg-green-100', icon: CheckCircle, text: 'Delivered' }
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', icon: XCircle, text: 'Cancelled' }
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: AlertCircle, text: status }
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      setShowStatusModal(false)
      return
    }

    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success(`Order status updated to ${newStatus}`)
      setShowStatusModal(false)
      
      // Refresh the order data
      await fetchAllOrders()
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const handleAddNote = async () => {
    if (!order || !noteText.trim()) return

    try {
      await addOrderNote(order.id, noteText.trim())
      toast.success('Note added successfully')
      setShowNoteModal(false)
      setNoteText('')
      
      // Refresh the order data
      await fetchAllOrders()
    } catch (error) {
      toast.error('Failed to add note')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
        <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Orders</span>
        </Link>
      </div>
    )
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
            <p className="text-sm text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNoteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            <span>Add Note</span>
          </button>
          
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Edit className="h-4 w-4" />
            <span>Update Status</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusConfig.text}
              </span>
            </div>

            {/* Status Timeline */}
            <div className="space-y-4">
              {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index
                const isCurrent = order.status === status
                const isLast = index === 3
                
                return (
                  <div key={status} className="flex items-center">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary ring-opacity-20' : ''}`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-500">Current status</p>
                      )}
                    </div>
                    {!isLast && (
                      <div className={`absolute left-4 w-0.5 h-6 mt-8 ${
                        isCompleted ? 'bg-primary' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.product?.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.product?.name || 'Product not found'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Price: ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-900">
                    ${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping:</span>
                  <span className="text-sm text-gray-900">
                    ${((order.total - order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && order.notes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
              
              <div className="space-y-3">
                {order.notes.map((note, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.createdAt)} by {note.author || 'Admin'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <div className="flex items-center justify-between">
                  <p className="text-gray-900">{order.customer?.name || 'N/A'}</p>
                  <button
                    onClick={() => copyToClipboard(order.customer?.name || '')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <div className="flex items-center justify-between">
                  <p className="text-gray-900">{order.customer?.email || 'N/A'}</p>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => copyToClipboard(order.customer?.email || '')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {order.customer?.email && (
                      <a
                        href={`mailto:${order.customer.email}`}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Mail className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {order.customer?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{order.customer.phone}</p>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyToClipboard(order.customer?.phone || '')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="p-1 text-gray-400 hover:text-green-600"
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Shipping Address
            </h2>
            
            {order.shippingAddress ? (
              <div className="space-y-2">
                <p className="text-gray-900">{order.shippingAddress.street}</p>
                <p className="text-gray-900">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-gray-900">{order.shippingAddress.country}</p>
                <button
                  onClick={() => copyToClipboard([
                    order.shippingAddress?.street,
                    `${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zipCode}`,
                    order.shippingAddress?.country
                  ].join('\n'))}
                  className="mt-2 text-sm text-primary hover:text-primary-dark flex items-center"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Address
                </button>
              </div>
            ) : (
              <p className="text-gray-500">No shipping address provided</p>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Information
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Payment Method</label>
                <p className="text-gray-900">{order.paymentMethod || 'Not specified'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Payment Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {order.paymentStatus || 'pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Order Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order ID</label>
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 font-mono text-sm">{order.id}</p>
                  <button
                    onClick={() => copyToClipboard(order.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Date</label>
                <p className="text-gray-900">{formatDate(order.createdAt)}</p>
              </div>

              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Edit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Update Order Status</h3>
                <p className="text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status: <span className="font-semibold">{order.status}</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Add Order Note</h3>
                <p className="text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your note here..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetailPage