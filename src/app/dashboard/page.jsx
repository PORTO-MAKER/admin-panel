"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FiEdit,
    FiTrash2,
    FiPlus,
    FiChevronLeft,
    FiChevronRight,
    FiSearch,
    FiFilter,
} from "react-icons/fi";
import { useDebounce } from "../../utils/debounce";

export default function SkillsPage() {
    const [skills, setSkills] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [modalCategories, setModalCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSkill, setCurrentSkill] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        lightImage: null,
        darkImage: null,
        category: "",
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalSkills: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const itemsPerPage = 10;
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchSkills = useCallback(
        async (page, search, categoryId) => {
            try {
                const res = await fetch(
                    `/api/skills?page=${page}&limit=${itemsPerPage}&name=${search}&category=${categoryId}`,
                    {
                        headers: {
                            "X-secret-code":
                                process.env.NEXT_PUBLIC_API_SECRET_KEY,
                        },
                    }
                );

                if (!res.ok) throw new Error("Gagal mengambil data skills");

                const { data: skillsData, pagination: paginationData } =
                    await res.json();

                setSkills(skillsData);
                setPagination(paginationData);
            } catch (error) {
                console.error(error);
            }
        },
        [itemsPerPage]
    );

    const fetchCategoriesForFilter = useCallback(async () => {
        try {
            const res = await fetch("/api/skill-categories/names", {
                headers: {
                    "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
                },
            });
            if (res.ok) {
                const { data } = await res.json();
                setAllCategories(data);
            }
        } catch (error) {
            console.error("Gagal mengambil kategori untuk filter", error);
        }
    }, []);

    useEffect(() => {
        fetchCategoriesForFilter();
    }, [fetchCategoriesForFilter]);

    useEffect(() => {
        fetchSkills(currentPage, debouncedSearchQuery, selectedCategory);
    }, [currentPage, debouncedSearchQuery, selectedCategory, fetchSkills]);

    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery, selectedCategory]);

    const paginate = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > pagination.totalPages) return;
        setCurrentPage(pageNumber);
    };

    const handleInputChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.files[0] });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("name", formData.name);
        data.append("category", formData.category);
        if (formData.lightImage) data.append("lightImage", formData.lightImage);
        if (formData.darkImage) data.append("darkImage", formData.darkImage);

        const url = currentSkill
            ? `/api/skills/${currentSkill._id}`
            : "/api/skills";
        const method = currentSkill ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                body: data,
                headers: {
                    "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
                },
            });
            if (res.ok) {
                fetchSkills(
                    currentPage,
                    debouncedSearchQuery,
                    selectedCategory
                );
                closeModal();
            } else {
                const result = await res.json();
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan. Silakan cek konsol.");
        }
    };

    const openModal = (skill = null) => {
        setCurrentSkill(skill);
        setModalCategories(allCategories);

        setFormData({
            name: skill ? skill.name : "",
            lightImage: null,
            darkImage: null,
            category: skill ? skill.categoryId : "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentSkill(null);
        setModalCategories([]);
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus skill ini?")) {
            try {
                const res = await fetch(`/api/skills/${id}`, {
                    method: "DELETE",
                    headers: {
                        "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
                    },
                });
                if (res.ok) {
                    if (skills.length === 1 && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    } else {
                        fetchSkills(
                            currentPage,
                            debouncedSearchQuery,
                            selectedCategory
                        );
                    }
                } else {
                    const result = await res.json();
                    alert(`Error: ${result.error}`);
                }
            } catch (error) {
                alert("Terjadi kesalahan saat menghapus.");
            }
        }
    };

    const firstItemNumber =
        pagination.totalSkills > 0
            ? (pagination.currentPage - 1) * itemsPerPage + 1
            : 0;
    const lastItemNumber =
        firstItemNumber > 0 ? firstItemNumber + skills.length - 1 : 0;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Manage Skills
                </h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-56 group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FiFilter className="h-5 w-5 text-gray-400" />
                        </span>
                        <select
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        >
                            <option value="all">Semua Kategori</option>
                            {allCategories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full md:w-72 group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Cari nama skill..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99] transition flex-shrink-0"
                    >
                        <FiPlus className="h-5 w-5" /> Tambah
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl overflow-hidden">
                <table className="min-w-full leading-normal text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            <th className="px-5 py-3">Skill Name</th>
                            <th className="px-5 py-3">Kategori</th>
                            <th className="px-5 py-3">Light Icon</th>
                            <th className="px-5 py-3">Dark Icon</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skills.length > 0 ? (
                            skills.map((skill) => (
                                <tr
                                    key={skill._id}
                                    className="border-b border-gray-200 dark:border-gray-800 odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm">
                                        <p className="text-gray-900 dark:text-gray-100 whitespace-nowrap font-medium">
                                            {skill.name}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <p className="text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                            {skill.categoryName || "N/A"}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <img
                                            src={skill.lightColorPath}
                                            alt={`${skill.name} Light`}
                                            className="h-10 w-10 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 object-contain p-1 bg-white"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="bg-gray-900 p-1 rounded-md inline-block ring-1 ring-gray-800">
                                            <img
                                                src={skill.darkColorPath}
                                                alt={`${skill.name} Dark`}
                                                className="h-10 w-10 object-contain"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <button
                                            onClick={() => openModal(skill)}
                                            className="inline-flex items-center justify-center p-2 rounded-lg text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors mr-2 focus:outline-none focus:ring-4 focus:ring-yellow-500/20"
                                        >
                                            <FiEdit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(skill._id)
                                            }
                                            className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-4 focus:ring-red-500/20"
                                        >
                                            <FiTrash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="text-center py-16 text-gray-500 dark:text-gray-400"
                                >
                                    No skills found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Showing{" "}
                        <span className="font-semibold">{firstItemNumber}</span>{" "}
                        to{" "}
                        <span className="font-semibold">{lastItemNumber}</span>{" "}
                        of{" "}
                        <span className="font-semibold">
                            {pagination.totalSkills}
                        </span>{" "}
                        results
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                        >
                            <FiChevronLeft />
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Page {currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === pagination.totalPages}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-800 p-6 md:p-7">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                            {currentSkill ? "Edit Skill" : "Tambah Skill Baru"}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Skill Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="masukkan nama skill"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Kategori
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih kategori
                                    </option>
                                    {modalCategories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Upload Light SVG File
                                </label>
                                <input
                                    type="file"
                                    name="lightImage"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                                    accept=".svg"
                                    required={!currentSkill}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Upload Dark SVG File
                                </label>
                                <input
                                    type="file"
                                    name="darkImage"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                                    accept=".svg"
                                    required={!currentSkill}
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
                                    {currentSkill ? "Update" : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
