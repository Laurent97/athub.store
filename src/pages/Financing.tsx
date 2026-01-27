import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, DollarSign, CreditCard, TrendingUp, Shield, Clock, CheckCircle, Users, FileText, Percent, ArrowRight, PiggyBank, Building, ArrowLeft } from 'lucide-react';

export default function Financing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loanAmount, setLoanAmount] = useState('5000');
  const [loanTerm, setLoanTerm] = useState('12');

  const financingOptions = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Buy Now Pay Later",
      description: "Split your purchase into manageable monthly payments",
      features: ["0% interest available", "No credit check required", "Instant approval", "Flexible payment terms"],
      minAmount: "$100",
      maxAmount: "$5,000"
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "Business Financing",
      description: "Specialized financing solutions for auto parts businesses",
      features: ["Competitive business rates", "Extended payment terms", "Bulk purchase discounts", "Line of credit options"],
      minAmount: "$10,000",
      maxAmount: "$500,000"
    },
    {
      icon: <PiggyBank className="w-6 h-6" />,
      title: "Personal Loans",
      description: "Affordable personal loans for auto parts purchases",
      features: ["Low fixed rates", "Terms up to 60 months", "Quick approval process", "No prepayment penalties"],
      minAmount: "$1,000",
      maxAmount: "$50,000"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Lease Options",
      description: "Lease high-value auto parts and equipment",
      features: ["Tax advantages", "Lower monthly payments", "Upgrade options", "End-of-lease flexibility"],
      minAmount: "$2,000",
      maxAmount: "$100,000"
    }
  ];

  const benefits = [
    "Quick and easy application process",
    "Competitive interest rates",
    "No hidden fees or charges",
    "Flexible repayment terms",
    "Instant pre-approval available",
    "Dedicated financing support"
  ];

  const process = [
    {
      step: "1",
      title: "Apply Online",
      description: "Fill out our simple online application form"
    },
    {
      step: "2",
      title: "Get Approved",
      description: "Receive instant approval decision"
    },
    {
      step: "3",
      title: "Choose Terms",
      description: "Select the payment plan that works for you"
    },
    {
      step: "4",
      title: "Complete Purchase",
      description: "Buy your auto parts with financing"
    },
    {
      step: "5",
      title: "Make Payments",
      description: "Pay conveniently over time"
    }
  ];

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(loanAmount) || 0;
    const months = parseInt(loanTerm) || 1;
    const annualRate = 0.089; // 8.9% APR
    const monthlyRate = annualRate / 12;
    
    if (principal === 0 || months === 0) return 0;
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return monthlyPayment.toFixed(2);
  };

  const eligibility = [
    "Minimum age 18 years",
    "Valid government-issued ID",
    "Active bank account",
    "Regular income source",
    "Good credit history (for some options)",
    "Resident of supported countries"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-800 dark:to-purple-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 text-purple-100 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <DollarSign className="w-16 h-16" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Flexible Financing Options
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8">
                Get the auto parts you need with affordable payment plans tailored to your budget
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                  Apply Now
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
                  Calculate Payments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
