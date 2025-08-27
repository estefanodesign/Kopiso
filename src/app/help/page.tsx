'use client'

import React from 'react'
import { useState } from 'react'
import CustomerLayout from '@/components/CustomerLayout'
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  User,
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  Phone,
  Mail,
  Clock
} from 'lucide-react'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState('all')
  const [expandedFAQ, setExpandedFAQ] = React.useState<string | null>(null)

  const faqs = [
    {
      id: '1',
      question: 'How do I create an account?',
      answer: 'Click on the \"Sign Up\" button in the top right corner and fill out the registration form with your email, password, and basic information.',
      category: 'account'
    },
    {
      id: '2',
      question: 'How can I track my order?',
      answer: 'Once your order is confirmed, you will receive a tracking number via email. You can also track your order by logging into your account and visiting the My Orders section.',
      category: 'orders'
    },
    {
      id: '3',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers.',
      category: 'payment'
    },
    {
      id: '4',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be in original condition with tags attached. Some restrictions apply for electronics and personal care items.',
      category: 'returns'
    },
    {
      id: '5',
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-7 business days. Express shipping takes 1-3 business days. Free shipping is available on orders over $50.',
      category: 'shipping'
    },
    {
      id: '6',
      question: 'How do I change my password?',
      answer: 'Go to your account settings, click on Security, then Change Password. Enter your current password and your new password twice to confirm.',
      category: 'account'
    },
    {
      id: '7',
      question: 'Can I cancel my order?',
      answer: 'You can cancel your order within 2 hours of placement if it has not been processed yet. After that, you will need to process a return once you receive the item.',
      category: 'orders'
    },
    {
      id: '8',
      question: 'Do you ship internationally?',
      answer: 'Currently, we ship to the United States, Canada, and Mexico. International shipping rates and delivery times vary by location.',
      category: 'shipping'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'account', name: 'Account & Profile', icon: User },
    { id: 'orders', name: 'Orders & Tracking', icon: Package },
    { id: 'payment', name: 'Payment & Billing', icon: CreditCard },
    { id: 'shipping', name: 'Shipping & Delivery', icon: Truck },
    { id: 'returns', name: 'Returns & Refunds', icon: RefreshCw }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <CustomerLayout>
      <div className=\"min-h-screen bg-neutral-50\">
        <div className=\"bg-gradient-to-r from-primary-500 to-secondary-500 text-white\">
          <div className=\"container-width section-padding py-16\">
            <div className=\"text-center max-w-3xl mx-auto\">
              <h1 className=\"text-4xl md:text-5xl font-bold mb-4\">How can we help you?</h1>
              <p className=\"text-xl text-primary-100 mb-8\">
                Search our knowledge base or contact our support team
              </p>
              
              <div className=\"relative max-w-2xl mx-auto\">
                <div className=\"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none\">
                  <Search className=\"h-6 w-6 text-gray-400\" />
                </div>
                <input
                  type=\"text\"
                  placeholder=\"Search for help...\"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className=\"w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-xl border-0 focus:ring-2 focus:ring-primary-300 focus:outline-none text-lg\"
                />
              </div>
            </div>
          </div>
        </div>

        <div className=\"container-width section-padding py-12\">
          <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-8\">
            <div className=\"lg:col-span-1\">
              <div className=\"bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8\">
                <h3 className=\"font-semibold text-gray-900 mb-4\">Browse by Category</h3>
                <div className=\"space-y-2\">
                  {categories.map(category => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeCategory === category.id
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className=\"h-5 w-5\" />
                        <span className=\"text-sm font-medium\">{category.name}</span>
                      </button>
                    )
                  })}
                </div>

                <div className=\"mt-8 pt-6 border-t border-gray-200\">
                  <h4 className=\"font-semibold text-gray-900 mb-4\">Need More Help?</h4>
                  <div className=\"space-y-3\">
                    <div className=\"flex items-center space-x-3 text-sm text-gray-600\">
                      <Phone className=\"h-4 w-4 text-primary-500\" />
                      <span>+1 (555) 123-4567</span>
                    </div>
                    <div className=\"flex items-center space-x-3 text-sm text-gray-600\">
                      <Mail className=\"h-4 w-4 text-primary-500\" />
                      <span>support@kopiso.com</span>
                    </div>
                    <div className=\"flex items-center space-x-3 text-sm text-gray-600\">
                      <Clock className=\"h-4 w-4 text-primary-500\" />
                      <span>Mon-Fri, 9AM-6PM EST</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className=\"lg:col-span-3\">
              <div className=\"bg-white rounded-xl shadow-sm border border-gray-200\">
                <div className=\"p-6 border-b border-gray-200\">
                  <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Frequently Asked Questions</h2>
                  <p className=\"text-gray-600\">
                    {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'} found
                    {activeCategory !== 'all' && ` in ${categories.find(c => c.id === activeCategory)?.name}`}
                  </p>
                </div>

                <div className=\"divide-y divide-gray-200\">
                  {filteredFAQs.length === 0 ? (
                    <div className=\"p-8 text-center\">
                      <HelpCircle className=\"h-12 w-12 text-gray-300 mx-auto mb-4\" />
                      <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No results found</h3>
                      <p className=\"text-gray-600 mb-4\">
                        Try adjusting your search or selecting a different category.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setActiveCategory('all')
                        }}
                        className=\"text-primary-600 hover:text-primary-700 font-medium\"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredFAQs.map(faq => (
                      <div key={faq.id} className=\"border-b border-gray-200 last:border-b-0\">
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className=\"w-full px-6 py-6 text-left hover:bg-gray-50 transition-colors\"
                        >
                          <div className=\"flex items-center justify-between\">
                            <h3 className=\"text-lg font-medium text-gray-900 pr-4\">
                              {faq.question}
                            </h3>
                            {expandedFAQ === faq.id ? (
                              <ChevronUp className=\"h-5 w-5 text-gray-500 flex-shrink-0\" />
                            ) : (
                              <ChevronDown className=\"h-5 w-5 text-gray-500 flex-shrink-0\" />
                            )}
                          </div>
                        </button>
                        
                        {expandedFAQ === faq.id && (
                          <div className=\"px-6 pb-6\">
                            <p className=\"text-gray-600 leading-relaxed\">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}"