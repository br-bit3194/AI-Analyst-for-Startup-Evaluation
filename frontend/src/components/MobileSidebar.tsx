import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Menu, LayoutDashboard, BarChart3, Box, Home, Gavel } from 'lucide-react';

const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { 
      name: 'Home', 
      path: '/', 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      name: 'Deal Analysis', 
      path: '/deal-analysis', 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      name: 'Finance Dashboard', 
      path: '/finance', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      name: '3D Visualization', 
      path: '/3d-visualization', 
      icon: <Box className="h-5 w-5" /> 
    },
    { 
      name: 'Verdict Demo', 
      path: '/verdict', 
      icon: <Gavel className="h-5 w-5" /> 
    },
  ];

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-slate-900 text-white shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out bg-slate-900 text-white`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <h1 className="text-xl font-bold">AI Analyst</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileSidebar;
