'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  CreditCard, 
  MapPin, 
  Plus, 
  Edit, 
  Check, 
  Lock,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react'
import CustomerLayout from '@/components/CustomerLayout'
import useCartStore from '@/store/cartStore'
import useProductStore from '@/store/productStore'
import useAuthStore from '@/store/authStore'
import useOrderStore from '@/store/orderStore'
import { Address, PaymentMethod, Product } from '@/types'
import { toast } from 'react-hot-toast'

function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { items, getCartSubtotal, clearCart } = useCartStore()
  const { products } = useProductStore()
  const { createOrder, isLoading: orderLoading } = useOrderStore()

  const [cartProducts, setCartProducts] = useState<Product[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [step, setStep] = useState(1) // 1: Address, 2: Payment, 3: Review
  const [isProcessing, setIsProcessing] = useState(false)

  // Form states
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false
  })

  const [paymentForm, setPaymentForm] = useState({
    type: 'credit_card' as PaymentMethod['type'],
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: ''
  })

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to continue checkout')
      router.push('/auth/login?redirect=/checkout')
      return
    }

    // Redirect to cart if empty
    if (items.length === 0) {
      router.push('/cart')
      return
    }

    // Load cart products
    loadCartProducts()

    // Set default address if user has addresses
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0]
      setSelectedAddress(defaultAddress)
    }
  }, [isAuthenticated, items.length, user, router])

  const loadCartProducts = () => {
    const productIds = [...new Set(items.map(item => item.productId))]
    const cartProductsData = productIds.map(id => 
      products.find(p => p.id === id)
    ).filter(Boolean) as Product[]
    setCartProducts(cartProductsData)
  }

  const subtotal = getCartSubtotal(cartProducts)
  const shipping = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate address form
    const requiredFields = ['name', 'phone', 'street', 'city', 'state', 'zipCode']
    const missingFields = requiredFields.filter(field => !addressForm[field as keyof Address])
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields')
      return
    }

    const newAddress: Address = {
      id: Date.now().toString(),
      name: addressForm.name!,
      phone: addressForm.phone!,
      street: addressForm.street!,
      city: addressForm.city!,
      state: addressForm.state!,
      zipCode: addressForm.zipCode!,
      country: addressForm.country!,
      isDefault: addressForm.isDefault || false
    }

    setSelectedAddress(newAddress)
    setShowAddressForm(false)
    toast.success('Address added successfully')
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentForm.type === 'credit_card') {
      const requiredFields = ['cardNumber', 'expiryMonth', 'expiryYear', 'cvv', 'holderName']
      const missingFields = requiredFields.filter(field => !paymentForm[field as keyof typeof paymentForm])
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required payment fields')
        return
      }
    }

    const payment: PaymentMethod = {
      type: paymentForm.type,
      ...(paymentForm.type === 'credit_card' && {
        last4: paymentForm.cardNumber.slice(-4),
        expiryMonth: parseInt(paymentForm.expiryMonth),
        expiryYear: parseInt(paymentForm.expiryYear)
      })
    }

    setSelectedPayment(payment)
    setShowPaymentForm(false)
    toast.success('Payment method added successfully')
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address')
      return
    }

    if (!selectedPayment) {
      toast.error('Please select a payment method')
      return
    }

    setIsProcessing(true)

    try {
      // Prepare order items
      const orderItems = items.map(item => {
        const product = cartProducts.find(p => p.id === item.productId)!
        const price = product.discountPrice || product.price
        
        return {
          productId: item.productId,
          productName: product.name,
          productImage: product.images[0] || '',
          price,
          quantity: item.quantity,
          total: price * item.quantity,
          selectedVariant: item.selectedVariant
        }
      })

      // Create order
      const result = await createOrder({
        items: orderItems,
        shippingAddress: selectedAddress,
        paymentMethod: selectedPayment,
        notes: orderNotes
      })

      if (result.success) {
        // Clear cart and redirect to success page
        clearCart()
        toast.success('Order placed successfully!')
        router.push(`/orders/${result.orderId}`)
      } else {
        toast.error(result.message || 'Failed to place order')
      }
    } catch (error) {
      console.error('Order placement error:', error)
      toast.error('An error occurred while placing your order')
    } finally {
      setIsProcessing(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1).padStart(2, '0')
  }))

  const years = Array.from({ length: 10 }, (_, i) => ({
    value: String(new Date().getFullYear() + i),
    label: String(new Date().getFullYear() + i)
  }))

  if (!isAuthenticated || items.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkout</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {[
                { number: 1, title: 'Shipping', completed: step > 1 },
                { number: 2, title: 'Payment', completed: step > 2 },
                { number: 3, title: 'Review', completed: false }
              ].map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    stepItem.completed ? 'bg-green-500 text-white' :
                    step === stepItem.number ? 'bg-primary-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {stepItem.completed ? <Check className="h-4 w-4" /> : stepItem.number}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step >= stepItem.number ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </span>
                  {index < 2 && (
                    <div className={`mx-4 h-0.5 w-16 ${
                      stepItem.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Existing Addresses */}
                {user?.addresses && user.addresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {user.addresses.map(address => (
                      <div
                        key={address.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?.id === address.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{address.name}</div>
                            <div className="text-sm text-gray-600">{address.phone}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {address.street}, {address.city}, {address.state} {address.zipCode}
                            </div>
                            {address.isDefault && (
                              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <button className="text-primary-500 hover:text-primary-600">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleAddressSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                        className="input-field"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                      className="input-field"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City *"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                        className="input-field"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State *"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                        className="input-field"
                        required
                      />
                      <input
                        type="text"
                        placeholder="ZIP Code *"
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="defaultAddress"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="defaultAddress" className="text-sm">
                        Set as default address
                      </label>
                    </div>
                    <div className="flex space-x-3">
                      <button type="submit" className="btn-primary">
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {selectedAddress && (
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary w-full mt-6"
                  >
                    Continue to Payment
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                  <button
                    onClick={() => setStep(1)}
                    className="btn-outline"
                  >
                    Back
                  </button>
                </div>

                {/* Payment Options */}
                <div className="space-y-4 mb-6">
                  {[
                    { type: 'credit_card', label: 'Credit/Debit Card', icon: CreditCard },
                    { type: 'paypal', label: 'PayPal', icon: CreditCard },
                    { type: 'cash_on_delivery', label: 'Cash on Delivery', icon: CreditCard }
                  ].map(option => (
                    <div
                      key={option.type}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentForm.type === option.type
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentForm({...paymentForm, type: option.type as PaymentMethod['type']})}
                    >
                      <div className="flex items-center space-x-3">
                        <option.icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Credit Card Form */}
                {paymentForm.type === 'credit_card' && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium">Card Details</h3>
                    <input
                      type="text"
                      placeholder="Cardholder Name *"
                      value={paymentForm.holderName}
                      onChange={(e) => setPaymentForm({...paymentForm, holderName: e.target.value})}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Card Number *"
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value.replace(/\D/g, '')})}
                      className="input-field"
                      maxLength={16}
                      required
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={paymentForm.expiryMonth}
                        onChange={(e) => setPaymentForm({...paymentForm, expiryMonth: e.target.value})}
                        className="input-field"
                        required
                      >
                        <option value="">Month *</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={paymentForm.expiryYear}
                        onChange={(e) => setPaymentForm({...paymentForm, expiryYear: e.target.value})}
                        className="input-field"
                        required
                      >
                        <option value="">Year *</option>
                        {years.map(year => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="CVV *"
                        value={paymentForm.cvv}
                        onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value.replace(/\D/g, '')})}
                        className="input-field"
                        maxLength={4}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary">
                      Save Payment Method
                    </button>
                  </form>
                )}

                {(paymentForm.type !== 'credit_card' || selectedPayment) && (
                  <button
                    onClick={() => {
                      if (paymentForm.type !== 'credit_card') {
                        setSelectedPayment({ type: paymentForm.type })
                      }
                      setStep(3)
                    }}
                    className="btn-primary w-full mt-6"
                  >
                    Continue to Review
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Review Order</h2>
                  <button
                    onClick={() => setStep(2)}
                    className="btn-outline"
                  >
                    Back
                  </button>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-medium mb-2">Shipping Address</h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{selectedAddress?.name}</div>
                      <div className="text-sm text-gray-600">{selectedAddress?.phone}</div>
                      <div className="text-sm text-gray-600">
                        {selectedAddress?.street}, {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.zipCode}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedPayment?.type === 'credit_card' && (
                        <span>Credit Card ending in {selectedPayment.last4}</span>
                      )}
                      {selectedPayment?.type === 'paypal' && <span>PayPal</span>}
                      {selectedPayment?.type === 'cash_on_delivery' && <span>Cash on Delivery</span>}
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div>
                    <label className="block font-medium mb-2">Order Notes (Optional)</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Any special instructions for your order..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || orderLoading}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing || orderLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2" />
                        Processing Order...
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map(item => {
                  const product = cartProducts.find(p => p.id === item.productId)
                  if (!product) return null

                  const itemPrice = product.discountPrice || product.price
                  const itemTotal = itemPrice * item.quantity

                  return (
                    <div key={item.productId} className="flex space-x-3">
                      <Image
                        src={product.images[0] || '/api/placeholder/60/60'}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                        <div className="text-sm font-medium">${itemTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <CustomerLayout>
      <CheckoutPage />
    </CustomerLayout>
  )
}