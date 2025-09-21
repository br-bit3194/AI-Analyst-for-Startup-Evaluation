import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MenuOutlined, CloseOutlined, BellOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Format time as HH:MM AM/PM
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/analysis':
        return 'Deal Analysis';
      case '/committee':
        return 'Investment Committee';
      case '/portfolio':
        return 'Portfolio';
      case '/reports':
        return 'Reports';
      default:
        return 'AI Startup Analyst';
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left section */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              {isMenuOpen ? <CloseOutlined className="text-lg" /> : <MenuOutlined className="text-lg" />}
            </button>
            <h1 className="ml-2 text-xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchOutlined className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search deals, companies, or metrics..."
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-1">
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Help"
              >
                <QuestionCircleOutlined className="text-lg" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
                title="Notifications"
              >
                <BellOutlined className="text-lg" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
            
            <div className="hidden md:flex items-center space-x-3 border-l border-gray-200 pl-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Investor Dashboard</p>
                <p className="text-xs text-gray-500">{formattedTime} • {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {getPageTitle().charAt(0)}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
