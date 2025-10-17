import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
