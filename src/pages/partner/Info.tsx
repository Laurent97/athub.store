import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Car, DollarSign, Users, TrendingUp, Shield, Clock, Award, Target, Zap, CheckCircle, Star, ArrowRight, Package, Wrench, Globe, Headphones, BarChart, Lock, Truck } from 'lucide-react';

export default function PartnerInfo() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="bg-gradient-accent rounded-b-2xl text-white pt-12 pb-8 px-4">
          <div className="container-wide max-w-6xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Partner Program Information</h1>
            <p className="text-white/90 text-lg">Everything you need to know about becoming an AutoTradeHub Partner</p>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Start Your Automotive Business Today</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Join thousands of successful entrepreneurs building profitable automotive businesses with zero inventory risk and unlimited earning potential.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/partner/apply" 
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    to="/faqs" 
                    className="inline-flex items-center gap-2 bg-transparent border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary/10 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">5,200+</div>
                  <p className="text-sm text-muted-foreground">Active Partners</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">97%</div>
                  <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">$100K+</div>
                  <p className="text-sm text-muted-foreground">Products Available</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">200+</div>
                  <p className="text-sm text-muted-foreground">Manufacturers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to start your automotive business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Choose Products</h3>
              <p className="text-muted-foreground mb-4">
                Browse our catalog of 100,000+ automotive products and add items to your store. No upfront costs!
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Minimum 10 products to start</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Recommended 30+ for visibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Mix categories for best results</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Set Your Prices</h3>
              <p className="text-muted-foreground mb-4">
                Add your profit margin on top of wholesale prices. Complete pricing freedom!
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <div className="font-mono text-sm">
                  <p>Wholesale: $80</p>
                  <p>Your Markup: +$24 (30%)</p>
                  <p className="font-bold text-primary">Selling Price: $104</p>
                  <p className="font-bold text-green-600">Your Profit: $24</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Earn Profits</h3>
              <p className="text-muted-foreground mb-4">
                When customers buy, you pay wholesale and keep the profit. Simple and risk-free!
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Customer buys from your store</span>
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>Manufacturer ships directly</span>
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>You receive profit within 8 days</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AutoTradeHub?</h2>
            <p className="text-xl text-muted-foreground">The advantages that set our partners up for success</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold mb-2">Zero Risk</h3>
              <p className="text-sm text-muted-foreground">No inventory investment, no storage costs, no upfront fees</p>
            </div>

            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Huge Selection</h3>
              <p className="text-sm text-muted-foreground">100,000+ products from 200+ manufacturers</p>
            </div>

            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Built-in Traffic</h3>
              <p className="text-sm text-muted-foreground">500,000+ monthly buyers on our platform</p>
            </div>

            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-bold mb-2">Full Support</h3>
              <p className="text-sm text-muted-foreground">24/7 support, training, and community</p>
            </div>
          </div>
        </div>

        {/* Earning Potential */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Earning Potential</h2>
            <p className="text-xl text-muted-foreground">Real income from successful partners</p>
          </div>

          <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4">Partner Level</th>
                    <th className="text-left p-4">Products Listed</th>
                    <th className="text-left p-4">Monthly Sales</th>
                    <th className="text-left p-4">Monthly Profit</th>
                    <th className="text-left p-4">Time Commitment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-4 font-semibold">Starter</td>
                    <td className="p-4">30-50</td>
                    <td className="p-4">15-25</td>
                    <td className="p-4 font-bold text-green-600">$1,500 - $3,000</td>
                    <td className="p-4">5-10 hrs/week</td>
                  </tr>
                  <tr className="border-t border-border bg-muted/30">
                    <td className="p-4 font-semibold">Growing</td>
                    <td className="p-4">100-200</td>
                    <td className="p-4">40-60</td>
                    <td className="p-4 font-bold text-green-600">$4,000 - $8,000</td>
                    <td className="p-4">15-20 hrs/week</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-4 font-semibold">Established</td>
                    <td className="p-4">300-500</td>
                    <td className="p-4">100-150</td>
                    <td className="p-4 font-bold text-green-600">$10,000 - $20,000</td>
                    <td className="p-4">30-40 hrs/week</td>
                  </tr>
                  <tr className="border-t border-border bg-muted/30">
                    <td className="p-4 font-semibold">Top Performer</td>
                    <td className="p-4">500+</td>
                    <td className="p-4">200+</td>
                    <td className="p-4 font-bold text-green-600">$25,000 - $50,000+</td>
                    <td className="p-4">40+ hrs/week</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold">Sarah's Success</h4>
                  <p className="text-sm text-muted-foreground">Part-time Partner</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                "I started with 30 accessories and now make $3,750/month working just 10 hours a week. Perfect side income!"
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold">Mike's Journey</h4>
                  <p className="text-sm text-muted-foreground">Full-time Business</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                "Replaced my corporate job in 6 months. Now earning $12,000/month with 200 products listed."
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold">Lisa's Niche</h4>
                  <p className="text-sm text-muted-foreground">EV Specialist</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                "Specialized in electric vehicle accessories. Now the go-to expert with $18,000 monthly profit."
              </p>
            </div>
          </div>
        </div>

        {/* Product Categories */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Product Categories</h2>
            <p className="text-xl text-muted-foreground">Diverse inventory for every automotive need</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <Car className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2">Complete Vehicles</h3>
              <p className="text-sm text-muted-foreground mb-2">New, Used, Certified</p>
              <p className="text-xs font-semibold text-green-600">20-30% margin</p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <Wrench className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2">Engine Parts</h3>
              <p className="text-sm text-muted-foreground mb-2">OEM & Aftermarket</p>
              <p className="text-xs font-semibold text-green-600">30-50% margin</p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <Package className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2">Accessories</h3>
              <p className="text-sm text-muted-foreground mb-2">Interior & Exterior</p>
              <p className="text-xs font-semibold text-green-600">40-60% margin</p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2">Maintenance</h3>
              <p className="text-sm text-muted-foreground mb-2">Fluids, Filters, Brakes</p>
              <p className="text-xs font-semibold text-green-600">25-35% margin</p>
            </div>
          </div>
        </div>

        {/* Partner Tiers */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Partner Tiers</h2>
            <p className="text-xl text-muted-foreground">Choose the plan that fits your goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="text-3xl font-bold text-green-600 mb-4">FREE</div>
              <p className="text-muted-foreground mb-4">Perfect for getting started</p>
              <ul className="space-y-2 text-sm mb-6">
                <li>• Up to 50 products</li>
                <li>• Basic store template</li>
                <li>• Standard support</li>
                <li>• Community access</li>
              </ul>
              <p className="text-sm font-semibold text-green-600">Potential: $1,000-5,000/mo</p>
            </div>

            <div className="bg-card rounded-lg p-6 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Growth</h3>
              <div className="text-3xl font-bold text-primary mb-4">$49/mo</div>
              <p className="text-muted-foreground mb-4">For serious income</p>
              <ul className="space-y-2 text-sm mb-6">
                <li>• Up to 500 products</li>
                <li>• Custom design</li>
                <li>• Priority support</li>
                <li>• Marketing tools</li>
                <li>• Advanced analytics</li>
              </ul>
              <p className="text-sm font-semibold text-primary">Potential: $5,000-20,000/mo</p>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <div className="text-3xl font-bold text-primary mb-4">$99/mo</div>
              <p className="text-muted-foreground mb-4">For full-time business</p>
              <ul className="space-y-2 text-sm mb-6">
                <li>• Unlimited products</li>
                <li>• Premium features</li>
                <li>• Dedicated manager</li>
                <li>• Team accounts</li>
                <li>• API access</li>
              </ul>
              <p className="text-sm font-semibold text-primary">Potential: $20,000-75,000/mo</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Getting Started Requirements</h2>
            <p className="text-xl text-muted-foreground">Simple requirements to launch your business</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                What You Need
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>At least 10 products in your store</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Store name and basic branding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Payment method for wholesale</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Bank account for profits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>5+ hours per week commitment</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                What We Provide
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Professional store template</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Hosting and security</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Payment processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>Marketing tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <span>24/7 support and training</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support & Training */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Support & Training</h2>
            <p className="text-xl text-muted-foreground">We're here to help you succeed</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Live chat, email, and phone support</p>
            </div>

            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">Real-time sales data and insights</p>
            </div>

            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">5,000+ active partners to learn from</p>
            </div>

            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-bold mb-2">Training</h3>
              <p className="text-sm text-muted-foreground">Weekly webinars and video courses</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container-wide max-w-6xl mx-auto py-12 px-4">
          <div className="bg-gradient-accent rounded-lg text-white p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Automotive Business?</h2>
            <p className="text-xl mb-6">
              Join thousands of successful partners building profitable businesses with zero risk
            </p>
            
            <div className="bg-white/10 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
              <p className="text-lg font-semibold mb-2">Limited Time Offer</p>
              <p className="mb-2">Apply this week and get:</p>
              <ul className="text-left max-w-md mx-auto space-y-1">
                <li>• First 3 months FREE on Growth tier ($147 value)</li>
                <li>• Personal success coach for 90 days</li>
                <li>• $500 advertising credit</li>
                <li>• Priority product access</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/partner/apply" 
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors text-lg"
              >
                Apply Now - Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/faqs" 
                className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Read FAQs
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
