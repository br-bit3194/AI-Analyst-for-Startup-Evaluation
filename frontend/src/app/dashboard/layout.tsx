import { Sidebar } from "@/components/ui/sidebar";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { SidebarContent } from "./sidebar-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden">
      <BackgroundPaths className="absolute inset-0 -z-10" />
      <Sidebar>
        <SidebarContent />
      </Sidebar>

      <main className="flex-1 overflow-y-auto p-6 relative z-10 h-full">
        {children}
      </main>
    </div>
  );
}
