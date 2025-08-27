'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useAdminStore from '@/store/adminStore'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Package,
  Tag,
  Star,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  ShoppingCart
} from 'lucide-react'
import { Product } from '@/types'
import toast from 'react-hot-toast'

interface ProductViewPageProps {
  params: {
    id: string
  }
}

const ProductViewPage = ({ params }: ProductViewPageProps) => {
  const router = useRouter()
  const { products, deleteProduct, fetchAllProducts } = useAdminStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const loadProduct = () => {
      const foundProduct = products.find(p => p.id === params.id)
      if (foundProduct) {
        setProduct(foundProduct)
        setLoading(false)
      } else if (products.length > 0) {
        // Product not found
        toast.error('Product not found')
        router.push('/admin/products')
      }
    }

    if (products.length === 0) {
      fetchAllProducts().then(() => {
        loadProduct()
      })
    } else {
      loadProduct()
    }
  }, [params.id, products, fetchAllProducts, router])

  const handleDeleteProduct = async () => {
    if (!product) return

    try {
      await deleteProduct(product.id)
      toast.success('Product deleted successfully!')
      router.push('/admin/products')
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100', icon: XCircle }
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100', icon: AlertCircle }
    return { text: 'In Stock', color: 'text-green-600 bg-green-100', icon: CheckCircle }
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

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    )
  }

  const stockStatus = getStockStatus(product.stock)
  const StockIcon = stockStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-600">Product details and information</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Link>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
            
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{product.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{product.category}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Brand</label>
                  <p className="text-gray-900">{product.brand || 'Not specified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-lg font-semibold text-gray-900">{product.price.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Stock</label>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900 mr-2">{product.stock}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      <StockIcon className="h-3 w-3 mr-1" />
                      {stockStatus.text}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Rating</label>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-gray-900">{product.rating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({product.reviews?.length || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Views</span>
                </div>
                <span className="font-medium text-gray-900">--</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Orders</span>
                </div>
                <span className="font-medium text-gray-900">--</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <span className="font-medium text-gray-900">--</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Created</span>
                </div>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(product.createdAt)}
                </p>
              </div>

              {product.updatedAt && (
                <div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Last Updated</span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(product.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-3">
              <Link
                href={`/products/${product.id}`}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                <span>View in Store</span>
              </Link>
              
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Product</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<strong>{product.name}</strong>"?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
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

export default ProductViewPage