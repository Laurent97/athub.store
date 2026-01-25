import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PartnerRegisterRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Open the modal and redirect to home
    if (typeof window !== 'undefined' && (window as any).openPartnerModal) {
      (window as any).openPartnerModal();
    }
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Opening partner registration...</p>
      </div>
    </div>
  );
};

export default PartnerRegisterRedirect;
