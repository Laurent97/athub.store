import { supabase } from './client';

export const seedSamplePartners = async () => {
  try {
    console.log('Starting to seed sample partner data...');

    // Sample partner data
    const samplePartners = [
      {
        store_name: 'AutoParts Pro',
        store_slug: 'autoparts-pro',
        store_tagline: 'Premium Auto Parts Since 2010',
        store_description: 'We specialize in high-quality OEM and aftermarket auto parts for all major vehicle brands. Our extensive inventory includes engine components, brake systems, suspension parts, and more.',
        business_type: 'business',
        store_category: 'premium_auto',
        year_established: 2010,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#2563eb',
        accent_color: '#10b981',
        contact_email: 'info@autopartspro.com',
        contact_phone: '+1-555-0123',
        website: 'https://autopartspro.com',
        country: 'US',
        city: 'Detroit',
        timezone: 'America/Detroit',
        business_hours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '15:00' },
          sunday: { open: '', close: '' }
        },
        commission_rate: 15,
        total_earnings: 125000,
        total_orders: 450,
        rating: 4.8,
        store_visits: 12500,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'Speed Performance',
        store_slug: 'speed-performance',
        store_tagline: 'High-Performance Parts for Enthusiasts',
        store_description: 'Your destination for high-performance automotive parts and accessories. We carry everything from turbochargers to exhaust systems for the serious car enthusiast.',
        business_type: 'corporation',
        store_category: 'performance',
        year_established: 2015,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#dc2626',
        accent_color: '#f59e0b',
        contact_email: 'sales@speedperformance.com',
        contact_phone: '+1-555-0124',
        website: 'https://speedperformance.com',
        country: 'US',
        city: 'Los Angeles',
        timezone: 'America/Los_Angeles',
        business_hours: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '10:00', close: '17:00' },
          sunday: { open: '', close: '' }
        },
        commission_rate: 18,
        total_earnings: 89000,
        total_orders: 320,
        rating: 4.6,
        store_visits: 8900,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'CarCare Essentials',
        store_slug: 'carcare-essentials',
        store_tagline: 'Premium Car Care Products',
        store_description: 'We provide premium car care products including waxes, polishes, interior cleaners, and detailing supplies. Keep your vehicle looking its best with our professional-grade products.',
        business_type: 'llc',
        store_category: 'care',
        year_established: 2018,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#059669',
        accent_color: '#0891b2',
        contact_email: 'hello@carcareessentials.com',
        contact_phone: '+1-555-0125',
        website: 'https://carcareessentials.com',
        country: 'CA',
        city: 'Toronto',
        timezone: 'America/Toronto',
        business_hours: {
          monday: { open: '08:30', close: '17:30' },
          tuesday: { open: '08:30', close: '17:30' },
          wednesday: { open: '08:30', close: '17:30' },
          thursday: { open: '08:30', close: '17:30' },
          friday: { open: '08:30', close: '17:30' },
          saturday: { open: '09:00', close: '14:00' },
          sunday: { open: '', close: '' }
        },
        commission_rate: 12,
        total_earnings: 45000,
        total_orders: 180,
        rating: 4.9,
        store_visits: 5600,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'Auto Electronics Hub',
        store_slug: 'auto-electronics-hub',
        store_tagline: 'Advanced Automotive Electronics',
        store_description: 'Specializing in cutting-edge automotive electronics including GPS systems, car audio, security systems, and diagnostic tools. Upgrade your vehicle with the latest technology.',
        business_type: 'partnership',
        store_category: 'electronics',
        year_established: 2012,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#7c3aed',
        accent_color: '#ec4899',
        contact_email: 'info@autoelectronicshub.com',
        contact_phone: '+1-555-0126',
        website: 'https://autoelectronicshub.com',
        country: 'UK',
        city: 'London',
        timezone: 'Europe/London',
        business_hours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { open: '', close: '' }
        },
        commission_rate: 20,
        total_earnings: 156000,
        total_orders: 520,
        rating: 4.7,
        store_visits: 11200,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'Tools & Equipment Plus',
        store_slug: 'tools-equipment-plus',
        store_tagline: 'Professional Automotive Tools',
        store_description: 'Your source for professional-grade automotive tools and equipment. From basic hand tools to advanced diagnostic equipment, we have everything mechanics need.',
        business_type: 'individual',
        store_category: 'tools',
        year_established: 2016,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#ea580c',
        accent_color: '#16a34a',
        contact_email: 'sales@toolsequipmentplus.com',
        contact_phone: '+1-555-0127',
        website: 'https://toolsequipmentplus.com',
        country: 'AU',
        city: 'Sydney',
        timezone: 'Australia/Sydney',
        business_hours: {
          monday: { open: '07:00', close: '17:00' },
          tuesday: { open: '07:00', close: '17:00' },
          wednesday: { open: '07:00', close: '17:00' },
          thursday: { open: '07:00', close: '17:00' },
          friday: { open: '07:00', close: '17:00' },
          saturday: { open: '08:00', close: '12:00' },
          sunday: { open: '', close: '' }
        },
        commission_rate: 14,
        total_earnings: 78000,
        total_orders: 290,
        rating: 4.5,
        store_visits: 7800,
        is_active: true,
        partner_status: 'approved'
      },
      {
        store_name: 'Car Accessories World',
        store_slug: 'car-accessories-world',
        store_tagline: 'Everything for Your Car Interior & Exterior',
        store_description: 'Transform your vehicle with our extensive collection of car accessories. From floor mats and seat covers to exterior styling and lighting, we have it all.',
        business_type: 'business',
        store_category: 'accessories',
        year_established: 2019,
        store_logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
        store_banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        brand_color: '#0891b2',
        accent_color: '#6366f1',
        contact_email: 'info@caraccessoriesworld.com',
        contact_phone: '+1-555-0128',
        website: 'https://caraccessoriesworld.com',
        country: 'DE',
        city: 'Berlin',
        timezone: 'Europe/Berlin',
        business_hours: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '10:00', close: '18:00' },
          sunday: { open: '11:00', close: '16:00' }
        },
        commission_rate: 16,
        total_earnings: 92000,
        total_orders: 380,
        rating: 4.4,
        store_visits: 9200,
        is_active: true,
        partner_status: 'approved'
      }
    ];

    // Insert sample partners
    for (const partner of samplePartners) {
      const userId = crypto.randomUUID();
      
      // Generate store ID
      const storeId = 'STORE' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Generate referral and invitation codes
      const referralCode = partner.store_name.replace(/\s+/g, '').substring(0, 6).toUpperCase() + '2025';
      const invitationCode = partner.store_name.replace(/\s+/g, '').substring(0, 5).toUpperCase() + 'INV';

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `partner${storeId.toLowerCase()}@example.com`,
          full_name: `${partner.store_name} Owner`,
          user_type: 'partner',
          partner_status: 'approved'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        continue;
      }

      // Create partner profile
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: userId,
          store_id: storeId,
          referral_code: referralCode,
          invitation_code: invitationCode,
          ...partner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (partnerError) {
        console.error('Error creating partner profile:', partnerError);
        continue;
      }

      console.log(`Created partner: ${partner.store_name}`);
    }

    console.log('Sample partner data seeded successfully!');
    return { success: true, message: 'Sample partners created successfully' };

  } catch (error) {
    console.error('Error seeding sample partners:', error);
    return { success: false, error: error.message };
  }
};

// Function to clear all sample data (for testing)
export const clearSamplePartners = async () => {
  try {
    // Get partner profiles to delete
    const { data: partners } = await supabase
      .from('partner_profiles')
      .select('id, user_id')
      .eq('partner_status', 'approved');

    if (partners && partners.length > 0) {
      const partnerIds = partners.map(p => p.id);
      const userIds = partners.map(p => p.user_id);
      
      // Delete partner products first (foreign key constraint)
      await supabase
        .from('partner_products')
        .delete()
        .in('partner_id', partnerIds);

      // Delete partner profiles
      await supabase
        .from('partner_profiles')
        .delete()
        .in('id', partnerIds);

      // Delete corresponding users
      await supabase
        .from('users')
        .delete()
        .in('id', userIds);
    }

    console.log('Sample partner data cleared successfully!');
    return { success: true, message: 'Sample partners cleared successfully' };

  } catch (error) {
    console.error('Error clearing sample partners:', error);
    return { success: false, error: error.message };
  }
};
