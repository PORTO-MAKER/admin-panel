"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Password salah");
            }
        } catch (error) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
                <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                    Login
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="password"
                            className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-4 py-2.5 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99] transition"
                    >
                        Masuk
                    </button>
                </form>
            </div>
        </div>
    );
}
