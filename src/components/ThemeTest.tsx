import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeTest() {
  const { mode, setMode, isDark } = useTheme();
  const [htmlClass, setHtmlClass] = useState('');

  useEffect(() => {
    setHtmlClass(document.documentElement.className);
    
    const observer = new MutationObserver(() => {
      setHtmlClass(document.documentElement.className);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setHtmlClass(document.documentElement.className);
  };

  return (
    <div className="p-6 m-4 border rounded-lg bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-4">🎨 Theme Debug Panel</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p><strong>Current mode:</strong> {mode}</p>
          <p><strong>Is dark:</strong> {isDark ? '✅ Yes' : '❌ No'}</p>
          <p><strong>HTML classes:</strong> {htmlClass || '(none)'}</p>
        </div>
        <div>
          <p><strong>System prefers dark:</strong> {window.matchMedia('(prefers-color-scheme: dark)').matches ? '✅ Yes' : '❌ No'}</p>
          <p><strong>CSS vars working:</strong> 
            <span className="inline-block w-4 h-4 ml-2 rounded" style={{ backgroundColor: 'hsl(var(--background))' }}></span>
          </p>
        </div>
      </div>

      <div className="space-x-2 mb-4">
        <button 
          onClick={() => setMode('light')}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Light Mode
        </button>
        <button 
          onClick={() => setMode('dark')}
          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm"
        >
          Dark Mode
        </button>
        <button 
          onClick={() => setMode('system')}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          System
        </button>
        <button 
          onClick={toggleDark}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          Toggle Dark Class
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 bg-primary text-primary-foreground rounded text-sm">
          Primary Color
        </div>
        <div className="p-3 bg-secondary text-secondary-foreground rounded text-sm">
          Secondary Color
        </div>
        <div className="p-3 bg-muted text-muted-foreground rounded text-sm">
          Muted Color
        </div>
        <div className="p-3 bg-accent text-accent-foreground rounded text-sm">
          Accent Color
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">B2B Components Test:</h4>
        <div className="b2b-card p-3">
          <h5 className="b2b-stat">B2B Stat Text</h5>
          <div className="flex gap-2 mt-2">
            <span className="b2b-badge-success">Success</span>
            <span className="b2b-badge-info">Info</span>
            <span className="b2b-badge-warning">Warning</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>If dark mode isn't working, check:</p>
        <ul className="list-disc list-inside text-xs">
          <li>Does "dark" class appear in HTML classes above?</li>
          <li>Do colors change when you click "Toggle Dark Class"?</li>
          <li>Are CSS variables loading (colored square visible)?</li>
        </ul>
      </div>
    </div>
  );
}
