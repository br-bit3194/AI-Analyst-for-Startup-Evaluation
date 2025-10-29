"use client";

import { Sidebar, SidebarBody, SidebarLink, SidebarSection } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut, BarChart3, FileText, Users, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundPaths } from "@/components/ui/background-paths";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only set sidebar to open by default on desktop
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);
  
  // Don't render the sidebar on the server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex-shrink-0" />
        <main className="flex-1 p-6 md:p-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
          {/* Add more skeleton loaders if needed */}
        </main>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex overflow-hidden">
      <BackgroundPaths className="absolute inset-0 -z-10" />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="h-full py-6">
          <div className="px-4 mb-8">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src="/startalytica_icon.jpeg" 
                    alt="Startalytica Logo" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <motion.span 
                  className="ml-2 font-semibold text-gray-900 whitespace-nowrap"
                  animate={{
                    opacity: sidebarOpen ? 1 : 0,
                    width: sidebarOpen ? 'auto' : 0,
                    marginLeft: sidebarOpen ? '0.5rem' : 0,
                  }}
                >
                  Startalytica
                </motion.span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SidebarSection>
              <SidebarLink
                link={{
                  label: "Dashboard",
                  href: "/dashboard",
                  icon: <LayoutDashboard className="h-5 w-5" />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Analytics",
                  href: "/analytics",
                  icon: <BarChart3 className="h-5 w-5" />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Documents",
                  href: "/documents",
                  icon: <FileText className="h-5 w-5" />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Team",
                  href: "/team",
                  icon: <Users className="h-5 w-5" />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Messages",
                  href: "/messages",
                  icon: <MessageSquare className="h-5 w-5" />,
                }}
              />
            </SidebarSection>

            <SidebarSection className="mt-auto mb-4">
              <SidebarLink 
                link={{
                  label: "Settings",
                  href: "/dashboard/settings",
                  icon: <Settings className="h-5 w-5" />
                }}
              />
              <SidebarLink 
                link={{
                  label: "Account",
                  href: "/dashboard/account",
                  icon: <UserCog className="h-5 w-5" />
                }}
              />
              <SidebarLink 
                link={{
                  label: "Logout",
                  href: "/logout",
                  icon: <LogOut className="h-5 w-5" />
                }}
              />
            </SidebarSection>
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 overflow-y-auto p-6 relative z-10 h-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-700">Welcome back! Here's what's happening with your startup.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          {[
            { title: 'Total Revenue', value: '$45,231', change: '+20.1%', changeType: 'increase' },
            { title: 'Active Users', value: '2,453', change: '+12.5%', changeType: 'increase' },
            { title: 'Conversion Rate', value: '3.2%', change: '-0.8%', changeType: 'decrease' },
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl shadow p-6 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow p-6 mb-8 transition-all hover:shadow-md">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { id: 1, user: 'Alex Johnson', action: 'uploaded a new document', time: '2 hours ago' },
              { id: 2, user: 'Maria Garcia', action: 'commented on your report', time: '4 hours ago' },
              { id: 3, user: 'James Wilson', action: 'shared a dashboard with you', time: '1 day ago' },
              { id: 4, user: 'Sarah Kim', action: 'requested access to analytics', time: '2 days ago' },
            ].map((activity) => (
              <div key={activity.id} className="flex items-start group">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium group-hover:bg-gray-200 transition-colors">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
