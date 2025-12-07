"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Briefcase, Users, Calendar, Settings, FileText, Upload, Shield, BarChart } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function Sidebar() {
    const pathname = usePathname()
    const { user } = useAuth()

    const isAdmin = user?.role === 'admin'
    const isCandidate = user?.role === 'candidate'

    const userLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Jobs & Pipeline', href: '/jobs', icon: Briefcase },
        { name: 'Candidates', href: '/candidates/new', icon: Users },
        { name: 'Applications', href: '/applications', icon: FileText },
        { name: 'Reports', href: '/reports', icon: BarChart },
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Profile", href: "/portal/profile", icon: Users },
        { name: "AI Assistant", href: "/rag", icon: Users },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    const adminLinks = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Templates", href: "/admin/templates", icon: FileText },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ]

    const candidateLinks = [
        { name: "My Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
        { name: "Job Search", href: "/portal/jobs", icon: Briefcase },
        { name: "My Applications", href: "/portal/applications", icon: FileText },
        { name: "My Profile", href: "/portal/profile", icon: Users },
    ]

    let links = userLinks
    if (isAdmin) links = adminLinks
    if (isCandidate) links = candidateLinks

    return (
        <div className="pb-12 w-64 border-r min-h-screen bg-white fixed left-0 top-0 bottom-0 z-10">
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        Techmplish
                    </h2>
                    <div className="space-y-1">
                        {links.map((link) => (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={pathname === link.href ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                >
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.name}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
