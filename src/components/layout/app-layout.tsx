'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  FileText,
  BotMessageSquare,
  Settings,
  CircleHelp,
  FileWarning,
  Newspaper,
  User, // Added User icon
} from 'lucide-react';
import { Header } from './header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
    { title: 'Management Trust', href: '/management-trust', icon: ShieldCheck, color: 'text-emerald-400' },
    { title: 'Macro Simulation', href: '/macro-simulation', icon: TrendingUp, color: 'text-purple-400' },
    { title: 'Risk Analysis', href: '/risk-analysis', icon: FileText, color: 'text-rose-400' },
    { title: 'Regulatory Watch', href: '/regulatory-watch', icon: FileWarning, color: 'text-amber-400' },
    { title: 'Market News', href: '/news', icon: Newspaper, color: 'text-cyan-400' },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="bg-[#1a1b3b] text-white border-r-0">
        <SidebarHeader className="border-b border-white/10 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3 p-2 hover:opacity-80 transition-all">
            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <BotMessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-white font-headline leading-none">ClearFinance</h1>
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-widest mt-1">Forensic AI</span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="py-4">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href} className="px-2">
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.title}
                  className={`transition-all duration-200 rounded-lg mb-1 ${
                    pathname === item.href ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Link href={item.href}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 pt-4 pb-6">
          <SidebarMenu>
            {/* NEW: Dedicated Profile & Portfolio Button */}
            <SidebarMenuItem className="px-2">
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/portfolio'}
                className={`transition-all duration-200 rounded-lg mb-4 ${
                  pathname === '/portfolio' ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Link href="/portfolio" className="flex items-center gap-3">
                  <div className="bg-sky-500/20 p-1 rounded-md">
                    <User className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-semibold truncate">My Portfolio</span>
                    <span className="text-[10px] opacity-60">Manage Holdings</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="px-2">
              <SidebarMenuButton asChild tooltip="Settings" className="text-white/50 hover:text-white">
                <Link href="#"><Settings className="w-4 h-4" /><span>Settings</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-slate-50/50">
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}