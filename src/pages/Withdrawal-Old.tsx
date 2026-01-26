import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WithdrawalForm from '../components/Payment/WithdrawalForm';
import { ArrowLeft } from 'lucide-react';

export default function Withdrawal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/auth', { state: { from: '/payment/withdraw' } });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-grow ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="mb-12">
            <button
              onClick={() => navigate('/partner/dashboard/wallet')}
              className={`flex items-center mb-4 transition-colors ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Wallet
            </button>
          </div>

          {/* Render the clean component */}
          <WithdrawalForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
