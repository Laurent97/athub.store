import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, AlertCircle, Camera, FileText, Shield, Clock, Users, Wrench, Eye, Award, Star, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Inspection() {
  const [activeTab, setActiveTab] = useState('overview');

  const inspectionServices = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Visual Inspection",
      description: "Comprehensive visual examination for defects, damage, and quality issues",
      features: ["Surface condition check", "Color and finish verification", "Dimensional accuracy", "Cosmetic defect detection"]
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: "Functional Testing",
      description: "Complete functional testing to ensure parts work as intended",
      features: ["Mechanical operation test", "Electrical system check", "Performance verification", "Safety compliance test"]
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certification",
      description: "Official certification and documentation for quality assurance",
      features: ["Quality certificate", "Compliance documentation", "Test reports", "Warranty information"]
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Photo Documentation",
      description: "Detailed photographic evidence of inspection results",
      features: ["High-resolution photos", "360-degree views", "Defect documentation", "Before/after comparison"]
    }
  ];

  const process = [
    {
      step: "1",
      title: "Request Inspection",
      description: "Select inspection service when placing your order"
    },
    {
      step: "2",
      title: "Professional Inspection",
      description: "Certified inspectors examine your products thoroughly"
    },
    {
      step: "3",
      title: "Detailed Report",
      description: "Receive comprehensive inspection report with photos"
    },
    {
      step: "4",
      title: "Approval Decision",
      description: "Review results and approve or reject the shipment"
    },
    {
      step: "5",
      title: "Final Shipment",
      description: "Only approved products are shipped to you"
    }
  ];

  const benefits = [
    "Quality guarantee on all inspected parts",
    "Reduced risk of receiving defective items", 
    "Professional inspection by certified experts",
    "Detailed photo and video documentation",
    "Money-back guarantee for failed inspections",
    "Faster resolution for quality issues"
  ];

  const inspectionTypes = [
    {
      name: "Basic Inspection",
      price: "$19.99",
      features: ["Visual quality check", "Basic functionality test", "Photo documentation", "24-hour turnaround"],
      recommended: false
    },
    {
      name: "Standard Inspection", 
      price: "$49.99",
      features: ["Complete visual inspection", "Full functional testing", "Detailed photo report", "Measurement verification", "48-hour turnaround"],
      recommended: true
    },
    {
      name: "Premium Inspection",
      price: "$99.99",
      features: ["Comprehensive analysis", "Advanced testing", "Video documentation", "Certification included", "Priority service", "24-hour turnaround"],
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 text-green-100 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Professional Inspection Services
              </h1>
              <p className="text-xl md:text-2xl text-green-100 mb-8">
                Ensure quality and authenticity with our comprehensive inspection services for auto parts
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                  Request Inspection
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 py-12 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">100K+</div>
              <div className="text-gray-600 dark:text-gray-400">Inspections Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">99.8%</div>
              <div className="text-gray-600 dark:text-gray-400">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Certified Inspectors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">24h</div>
              <div className="text-gray-600 dark:text-gray-400">Average Turnaround</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {['overview', 'services', 'process', 'pricing'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Why Choose Professional Inspection?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our professional inspection services provide peace of mind when purchasing auto parts. We ensure every component meets quality standards before it reaches your doorstep.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Inspection Guarantee</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Every inspected part comes with our quality guarantee. If issues are found after inspection, we'll handle the resolution.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Full refund for failed inspections</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Expert inspectors with 10+ years experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Fast turnaround times</span>
                </div>
              </div>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Start Inspection Request
              </button>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Our Inspection Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {inspectionServices.map((service, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="text-green-600 mt-1">{service.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{service.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{service.description}</p>
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">How Inspection Works</h2>
            <div className="grid md:grid-cols-5 gap-6">
              {process.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
                  {index < process.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full">
                      <ArrowRight className="w-6 h-6 text-green-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Inspection Pricing</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {inspectionTypes.map((plan, index) => (
                <div key={index} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 ${
                  plan.recommended ? 'border-green-600 relative' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
                    <div className="text-3xl font-bold text-green-600">{plan.price}</div>
                    <div className="text-gray-600 dark:text-gray-400">per inspection</div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.recommended
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                    Select Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 dark:bg-green-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ensure Quality?</h2>
          <p className="text-xl mb-8 text-green-100 dark:text-green-200">
            Add professional inspection to your next order for complete peace of mind
          </p>
          <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Add Inspection to Order
          </button>
        </div>
      </div>
    </div>
  );
}
