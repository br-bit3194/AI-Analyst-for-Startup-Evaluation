import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  LineChartOutlined, 
  TeamOutlined, 
  FileTextOutlined, 
  SettingOutlined,
  DollarOutlined,
  BulbOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import StartalyticaIcon from '../../startalytica_icon.jpeg';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactElement;
  active: boolean;
  tooltip: string;
}

interface SidebarProps {
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <DashboardOutlined />,
      active: location.pathname === '/',
      tooltip: 'Overview of your investments'
    },
    { 
      name: 'Deal Analysis', 
      path: '/analysis', 
      icon: <LineChartOutlined />,
      active: location.pathname.startsWith('/analysis'),
      tooltip: 'Analyze potential investments'
    },
    { 
      name: 'Investment Committee', 
      path: '/committee', 
      icon: <TeamOutlined />,
      active: location.pathname.startsWith('/committee'),
      tooltip: 'Simulate committee decisions'
    },
    { 
      name: 'Portfolio', 
      path: '/portfolio', 
      icon: <DollarOutlined />,
      active: location.pathname.startsWith('/portfolio'),
      tooltip: 'View your investment portfolio'
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <FileTextOutlined />,
      active: location.pathname.startsWith('/reports'),
      tooltip: 'Generate and view reports'
    },
    { 
      name: 'Market Insights', 
      path: '/insights', 
      icon: <BulbOutlined />,
      active: location.pathname.startsWith('/insights'),
      tooltip: 'Market trends and insights'
    },
    { 
      name: 'Alerts', 
      path: '/alerts', 
      icon: <NotificationOutlined />,
      active: location.pathname.startsWith('/alerts'),
      tooltip: 'View your alerts'
    }
  ];
  
  const bottomItems: NavItem[] = [
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <SettingOutlined />,
      active: location.pathname.startsWith('/settings'),
      tooltip: 'Application settings'
    },
    { 
      name: 'Help', 
      path: '/help', 
      icon: <QuestionCircleOutlined />,
      active: location.pathname.startsWith('/help'),
      tooltip: 'Get help and support'
    },
    { 
      name: 'Logout', 
      path: '/logout', 
      icon: <LogoutOutlined />,
      active: location.pathname.startsWith('/logout'),
      tooltip: 'Sign out of your account'
    }
  ];

  return (
    <div className="flex h-screen">
      {/* Mobile/Compact Sidebar */}
      <div className="md:hidden w-16 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 fixed">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 p-2">
          <img 
            src={StartalyticaIcon} 
            alt="Startalytica Logo" 
            className="h-10 w-auto object-contain"
          />
          <span className="text-xl font-bold text-gray-800 ml-2 whitespace-nowrap overflow-hidden">
            Startalytica
          </span>
        </div>
        
        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2 px-2">
            {navItems.map((item) => (
              <Tooltip key={item.path} title={item.tooltip} placement="right">
                <Link
                  to={item.path}
                  className={`w-12 h-12 mx-auto flex items-center justify-center rounded-lg transition-colors duration-200 ${
                    item.active 
                      ? 'bg-purple-50 text-purple-600' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {React.cloneElement(item.icon, {
                    className: `text-xl ${item.active ? 'text-purple-600' : 'text-gray-500'}`
                  })}
                </Link>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="py-4 border-t border-gray-200">
          <div className="space-y-2 px-2">
            {bottomItems.map((item) => (
              <Tooltip key={item.path} title={item.tooltip} placement="right">
                <Link
                  to={item.path}
                  className={`w-12 h-12 mx-auto flex items-center justify-center rounded-lg transition-colors duration-200 ${
                    item.active
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {React.cloneElement(item.icon, {
                    className: `text-xl ${item.active ? 'text-purple-600' : 'text-gray-500'}`
                  })}
                </Link>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop/Expanded Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 w-64 h-screen fixed">
        <div className="flex flex-col w-64 h-full bg-white border-r border-gray-100 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-gray-100">
            <div className="flex items-center">
              <img 
                src={StartalyticaIcon} 
                alt="Startalytica Logo" 
                className="h-10 w-auto object-contain"
              />
              <span className="ml-3 text-xl font-bold text-gray-800 whitespace-nowrap">
                Startalytica
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Main
              </h3>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all ${
                    item.active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-3 ${item.active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {React.cloneElement(item.icon, { className: 'text-lg' })}
                  </span>
                  {item.name}
                  {item.active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600"></span>
                  )}
                </Link>
              ))}
            </div>

            {/* Bottom Navigation - Desktop */}
            <div className="px-3 mt-6 pt-4 border-t border-gray-100">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Account
              </h3>
              {bottomItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all ${
                    item.active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-3 ${item.active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {React.cloneElement(item.icon, { className: 'text-lg' })}
                  </span>
                  {item.name}
                </Link>
              ))}

              {/* User Profile */}
              <div className="p-4 mt-6 border-t border-gray-100">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Investor Account</p>
                    <p className="text-xs text-gray-500">Professional Plan</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {typeof window !== 'undefined' ? localStorage.getItem('userInitials') || 'IA' : 'IA'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Add padding to account for fixed sidebar */}
      <main className="flex-1 md:ml-64 ml-16 overflow-auto">
        {React.Children.map(children, (child) => 
          React.isValidElement(child) 
            ? React.cloneElement(child, { 
                className: `p-6 ${child.props.className || ''}`,
                ...child.props
              } as React.HTMLAttributes<HTMLElement>)
            : child
        )}
      </main>
    </div>
  );
};

export default Sidebar;
