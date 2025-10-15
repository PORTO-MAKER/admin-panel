"use client";

import { useState, useEffect } from "react";
import {
    FiEdit,
    FiTrash2,
    FiPlus,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

// Definisikan header di satu tempat agar mudah digunakan kembali
const apiHeaders = {
    "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
};

export default function SkillsPage() {
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSkill, setCurrentSkill] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        lightImageName: "",
        darkImageName: "",
        lightImage: null,
        darkImage: null,
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalSkills: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchSkills(currentPage);
    }, [currentPage]);

    const fetchSkills = async (page) => {
        try {
            const res = await fetch(
                `/api/skills?page=${page}&limit=${itemsPerPage}`,
                {
                    headers: apiHeaders, // Tambahkan header di sini
                }
            );
            if (!res.ok) throw new Error("Gagal mengambil data skills");

            const { data, pagination: paginationData } = await res.json();
            setSkills(data);
            setPagination(paginationData);
        } catch (error) {
            console.error(error);
            // Anda bisa menambahkan notifikasi error di sini
        }
    };

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
        data.append("lightImageName", formData.lightImageName);
        data.append("darkImageName", formData.darkImageName);
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
                    // Jangan gunakan 'Content-Type' saat mengirim FormData
                    "X-secret-code": process.env.NEXT_PUBLIC_API_SECRET_KEY,
                },
            });

            if (res.ok) {
                if (!currentSkill && pagination.totalPages > currentPage) {
                    setCurrentPage(pagination.totalPages + 1);
                } else {
                    fetchSkills(currentPage);
                }
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
        setFormData({
            name: skill ? skill.name : "",
            lightImageName: skill ? skill.lightColorPath.split("/").pop() : "",
            darkImageName: skill ? skill.darkColorPath.split("/").pop() : "",
            lightImage: null,
            darkImage: null,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentSkill(null);
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus skill ini?")) {
            try {
                const res = await fetch(`/api/skills/${id}`, {
                    method: "DELETE",
                    headers: apiHeaders, // Tambahkan header di sini
                });
                if (res.ok) {
                    if (skills.length === 1 && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    } else {
                        fetchSkills(currentPage);
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

    const firstItemNumber = (pagination.currentPage - 1) * itemsPerPage + 1;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Skills</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                >
                    <FiPlus className="mr-2" /> Tambah Skill
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            <th className="px-5 py-3">Skill Name</th>
                            <th className="px-5 py-3">Light Icon</th>
                            <th className="px-5 py-3">Dark Icon</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skills.map((skill) => (
                            <tr
                                key={skill._id}
                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                <td className="px-5 py-4 text-sm">
                                    <p className="text-gray-900 dark:text-white whitespace-no-wrap">
                                        {skill.name}
                                    </p>
                                </td>
                                <td className="px-5 py-4 text-sm">
                                    <img
                                        src={skill.lightColorPath}
                                        alt={`${skill.name} Light`}
                                        className="w-10 h-10"
                                    />
                                </td>
                                <td className="px-5 py-4 text-sm">
                                    <div className="bg-gray-800 dark:bg-gray-900 p-1 rounded-md inline-block">
                                        <img
                                            src={skill.darkColorPath}
                                            alt={`${skill.name} Dark`}
                                            className="w-10 h-10"
                                        />
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-right">
                                    <button
                                        onClick={() => openModal(skill)}
                                        className="text-yellow-500 hover:text-yellow-700 mr-4"
                                    >
                                        <FiEdit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(skill._id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FiTrash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.totalSkills > itemsPerPage && (
                <div className="flex justify-between items-center mt-6">
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Showing{" "}
                        <span className="font-semibold">{firstItemNumber}</span>{" "}
                        to{" "}
                        <span className="font-semibold">
                            {firstItemNumber + skills.length - 1}
                        </span>{" "}
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
                            className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700"
                        >
                            <FiChevronLeft />
                        </button>
                        <span className="text-sm">
                            Page {currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
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
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Light SVG Filename
                                </label>
                                <input
                                    type="text"
                                    name="lightImageName"
                                    value={formData.lightImageName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="contoh: vscode-light.svg"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Upload Light SVG File
                                </label>
                                <input
                                    type="file"
                                    name="lightImage"
                                    onChange={handleFileChange}
                                    className="w-full text-sm"
                                    accept=".svg"
                                    required={!currentSkill}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Dark SVG Filename
                                </label>
                                <input
                                    type="text"
                                    name="darkImageName"
                                    value={formData.darkImageName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="contoh: vscode-dark.svg"
                                    required
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
                                    className="w-full text-sm"
                                    accept=".svg"
                                    required={!currentSkill}
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
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
