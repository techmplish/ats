"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, User, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
    const { user, logout } = useAuth()

    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
            <div className="flex items-center w-96">
                <Search className="h-4 w-4 absolute ml-3 text-muted-foreground" />
                <Input placeholder="Search candidates, jobs..." className="pl-10" />
            </div>

            <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                    {user?.role}
                </div>
                <Button variant="outline" size="icon">
                    <Bell className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/avatars/01.png" alt="@user" />
                                <AvatarFallback>{user?.email[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.email}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.role}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
