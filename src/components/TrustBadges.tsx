import { Shield, Award, Globe, Headphones, Building2, Truck, CheckCircle, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Trade Assurance",
    description: "Protected orders up to $100,000 with full refund guarantee",
    stats: "100% Protection"
  },
  {
    icon: Building2,
    title: "Verified Suppliers",
    description: "All suppliers undergo rigorous verification and quality checks",
    stats: "10,000+ Verified"
  },
  {
    icon: Globe,
    title: "Global Logistics",
    description: "Door-to-door delivery to 150+ countries with full tracking",
    stats: "150+ Countries"
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Express delivery options with real-time shipment tracking",
    stats: "3-7 Days"
  },
  {
    icon: CheckCircle,
    title: "Quality Inspection",
    description: "Professional inspection services for all exported goods",
    stats: "ISO Certified"
  },
  {
    icon: TrendingUp,
    title: "Market Insights",
    description: "Real-time pricing data and market trend analysis",
    stats: "Live Data"
  }
];

const TrustBadges = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-white border-y border-gray-200">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Why Choose AutoTradeHub
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Your trusted partner for global automotive trade. We provide comprehensive solutions 
            to ensure safe, efficient, and profitable sourcing.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {feature.stats}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* B2B Statistics Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$50M+", label: "Annual Trade Volume" },
              { value: "10,000+", label: "Active Suppliers" },
              { value: "150+", label: "Countries Served" },
              { value: "99.8%", label: "Customer Satisfaction" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Industry Certified</h4>
            <p className="text-slate-600 text-sm">
              ISO 9001:2015 certified quality management system
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">24/7 Support</h4>
            <p className="text-slate-600 text-sm">
              Multilingual customer support team available round the clock
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Secure Payments</h4>
            <p className="text-slate-600 text-sm">
              Escrow protection and secure payment gateways
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-semibold mb-4">
            <Shield className="w-5 h-5" />
            Join 50,000+ Businesses Trusting AutoTradeHub
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
              Start Trading
            </button>
            <button className="px-8 py-3 border border-gray-300 text-slate-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
