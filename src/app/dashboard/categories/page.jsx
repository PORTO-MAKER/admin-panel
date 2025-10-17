"use client";

import { useState, useEffect, useCallback } from "react";
import { FiPlus } from "react-icons/fi";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/skill-categories", {
                headers: {
                    "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
                },
            });
            if (res.ok) {
                const { data } = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Gagal mengambil data kategori", error);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const openModal = () => {
        setNewCategoryName("");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const res = await fetch("/api/skill-categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
                },
                body: JSON.stringify({ name: newCategoryName }),
            });

            if (res.ok) {
                fetchCategories();
                closeModal();
            } else {
                const result = await res.json();
                alert(`Error: ${result.error || "Gagal menambahkan kategori"}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan saat menambahkan kategori.");
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Manage Categories
                </h1>
                <button
                    onClick={openModal}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99] transition"
                >
                    <FiPlus className="h-5 w-5" /> Tambah
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl overflow-hidden">
                <table className="min-w-full leading-normal text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            <th className="px-5 py-3">Nama Kategori</th>
                            <th className="px-5 py-3">Jumlah Skill</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length > 0 ? (
                            categories.map((cat) => (
                                <tr
                                    key={cat._id}
                                    className="border-b border-gray-200 dark:border-gray-800"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                        {cat.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                        {cat.skills.length}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="2"
                                    className="text-center py-16 text-gray-500 dark:text-gray-400"
                                >
                                    No categories found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-800 p-6 md:p-7">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                            Tambah Kategori Baru
                        </h2>
                        <form onSubmit={handleAddCategory}>
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Nama Kategori
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masukkan nama kategori..."
                                    value={newCategoryName}
                                    onChange={(e) =>
                                        setNewCategoryName(e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium px-4 py-2.5 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-500/20"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 shadow-sm transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99]"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
