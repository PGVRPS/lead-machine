'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Map,
  Send,
  Settings,
  Upload,
  Radar,
  Zap,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Scrape', href: '/dashboard/scrape', icon: Radar },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: FileBarChart },
  { name: 'Market Map', href: '/dashboard/map', icon: Map },
  { name: 'Outreach', href: '/dashboard/outreach', icon: Send },
  { name: 'Import', href: '/dashboard/import', icon: Upload },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-400 flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">VRPS</h1>
            <p className="text-xs text-slate-500">AI Lead Machine</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">VRPS Lead Machine</p>
          <p className="text-sm text-white font-medium mt-1">Gulf Coast Pipeline</p>
          <p className="text-xs text-slate-500 mt-1">Outscraper + Claude AI + Supabase</p>
        </div>
      </div>
    </aside>
  )
}
