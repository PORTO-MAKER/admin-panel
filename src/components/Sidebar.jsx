"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiTag } from "react-icons/fi";

const navLinks = [
    { href: "/", label: "Skills", icon: FiGrid },
    { href: "/categories", label: "Categories", icon: FiTag },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Admin
                </h1>
            </div>
            <nav className="flex-grow px-4 py-6">
                <ul>
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                            <Link href={href}>
                                <span
                                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        pathname === href
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    {label}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
