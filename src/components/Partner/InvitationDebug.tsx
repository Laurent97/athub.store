import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const InvitationDebug = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkPartners = async () => {
      setLoading(true);
      try {
        // Check for approved partners with invitation codes
        const { data, error } = await supabase
          .from('partner_profiles')
          .select('store_id, store_name, invitation_code, partner_status, is_active')
          .eq('partner_status', 'approved')
          .eq('is_active', true)
          .limit(10);

        if (error) {
          console.error('Error fetching partners:', error);
        } else {
          console.log('Found partners:', data);
          setPartners(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkPartners();
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4 dark:text-white">Partner Debug Info</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold dark:text-gray-200">Approved Partners with Invitation Codes:</h4>
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-2">
            {partners.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No approved partners found</p>
            ) : (
              partners.map((partner, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p><strong>Store:</strong> {partner.store_name}</p>
                  <p><strong>Store ID:</strong> {partner.store_id}</p>
                  <p><strong>Invitation Code:</strong> {partner.invitation_code || 'None'}</p>
                  <p><strong>Status:</strong> {partner.partner_status}</p>
                  <p><strong>Active:</strong> {partner.is_active ? 'Yes' : 'No'}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        This component helps debug invitation code validation.
      </div>
    </div>
  );
};

export default InvitationDebug;
