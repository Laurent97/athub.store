import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSidebar() {
  const { userProfile } = useAuth();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👤' },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/partners', label: 'Partners', icon: '👥' },
    { path: '/admin/orders', label: 'Orders', icon: '🛒' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  if (userProfile?.user_type !== 'admin') {
    return null;
  }

  return (
    <div className="w-full lg:w-64 bg-card rounded-lg shadow p-3 sm:p-4 h-fit border-border order-2 lg:order-1">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold text-foreground">Admin Panel</h2>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">Welcome, {userProfile.email}</p>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground border-l-4 border-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`
            }
          >
            <span className="mr-2 sm:mr-3 text-base sm:text-lg">{item.icon}</span>
            <span className="text-sm sm:text-base">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
        <div className="px-3 sm:px-4 py-2 bg-primary/10 rounded-lg">
          <div className="text-xs sm:text-sm font-medium text-primary">Admin ID</div>
          <div className="text-xs text-primary truncate" title={userProfile?.id}>
            {userProfile?.id?.substring(0, 16)}...
          </div>
        </div>
      </div>
    </div>
  );
}
