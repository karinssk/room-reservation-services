"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

type ProductCategory = {
    id: string;
    name: string;
    slug: string;
    logo: string;
    order: number;
};

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const Toast = MySwal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

export default function CategoriesManager() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [categoryForm, setCategoryForm] = useState({
        id: "",
        name: "",
        slug: "",
        logo: "",
        order: 0,
    });

    const loadCategories = async () => {
        if (!API_URL) return;
        const response = await fetch(`${API_URL}/product-categories`);
        const data = await response.json();
        setCategories(data.categories || []);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const uploadImage = async (file: File) => {
        if (!API_URL) {
            Toast.fire({ icon: "error", title: "Config Error: Backend URL missing" });
            console.error("API_URL is missing");
            return "";
        }
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(`${API_URL}/uploads`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const err = await response.json();
                Toast.fire({ icon: "error", title: `Upload failed: ${err.error}` });
                return "";
            }
            const data = await response.json();
            return data.url as string;
        } catch (e) {
            console.error("Upload error:", e);
            Toast.fire({ icon: "error", title: "Upload failed" });
            return "";
        }
    };

    const saveCategory = async () => {
        if (!API_URL || !categoryForm.name || !categoryForm.slug) {
            Toast.fire({ icon: "warning", title: "Name and Slug are required" });
            return;
        }
        const payload = {
            name: categoryForm.name,
            slug: categoryForm.slug,
            logo: categoryForm.logo,
            order: categoryForm.order || 0,
        };

        try {
            if (categoryForm.id) {
                await fetch(`${API_URL}/product-categories/${categoryForm.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                Toast.fire({ icon: "success", title: "Updated successfully" });
            } else {
                await fetch(`${API_URL}/product-categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                Toast.fire({ icon: "success", title: "Created successfully" });
            }
            setCategoryForm({ id: "", name: "", slug: "", logo: "", order: 0 });
            loadCategories();
        } catch (e) {
            Toast.fire({ icon: "error", title: "Failed to save" });
        }
    };

    const deleteCategory = async (id: string) => {
        if (!API_URL || !id) return;

        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "Products in this category will become uncategorized.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            await fetch(`${API_URL}/product-categories/${id}`, {
                method: "DELETE",
            });
            if (categoryForm.id === id) {
                setCategoryForm({ id: "", name: "", slug: "", logo: "", order: 0 });
            }
            loadCategories();
            Swal.fire("Deleted!", "Category has been deleted.", "success");
        }
    };

    return (
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[350px_1fr]">
                {/* Form */}
                <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {categoryForm.id ? "Edit Brand" : "Add New Brand"}
                    </h2>
                    <div className="mt-6 grid gap-4">
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Brand Name</span>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                placeholder="e.g. Mitsubishi Electric"
                                value={categoryForm.name}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                        slug: slugify(event.target.value || prev.slug),
                                    }))
                                }
                            />
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Slug</span>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                placeholder="e.g. mitsubishi-electric"
                                value={categoryForm.slug}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        slug: slugify(event.target.value),
                                    }))
                                }
                            />
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Logo</span>
                            <div className="flex gap-4 items-center">
                                {categoryForm.logo && (
                                    <div className="relative h-16 w-16 shrink-0 rounded-lg border border-slate-100 bg-slate-50 p-2">
                                        <img
                                            src={resolveUploadUrl(categoryForm.logo)}
                                            className="h-full w-full object-contain"
                                        />
                                        <button
                                            onClick={() => setCategoryForm(prev => ({ ...prev, logo: "" }))}
                                            className="absolute -top-2 -right-2 rounded-full bg-rose-500 text-white p-1 shadow-sm"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                                <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center transition hover:bg-slate-100">
                                    <span className="text-xs text-slate-500">Click to upload logo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = await uploadImage(file);
                                                if (url) setCategoryForm((prev) => ({ ...prev, logo: url }));
                                            }
                                            e.target.value = ""; // Reset to allow re-selecting same file
                                        }}
                                    />
                                </label>
                            </div>
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Sort Order</span>
                            <input
                                type="number"
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                value={categoryForm.order}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        order: Number(event.target.value || 0),
                                    }))
                                }
                            />
                        </label>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={saveCategory}
                                className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                {categoryForm.id ? "Update Brand" : "Create Brand"}
                            </button>
                            {categoryForm.id && (
                                <button
                                    onClick={() =>
                                        setCategoryForm({ id: "", name: "", slug: "", logo: "", order: 0 })
                                    }
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">Brands</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2">
                                        {category.logo ? (
                                            <img
                                                src={resolveUploadUrl(category.logo)}
                                                alt={category.name}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-xl text-slate-300 font-bold">{category.name[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-700">
                                            {category.name}
                                        </h3>
                                        <p className="text-xs text-slate-400">/{category.slug}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setCategoryForm({
                                                id: category.id,
                                                name: category.name,
                                                slug: category.slug,
                                                logo: category.logo || "",
                                                order: category.order || 0,
                                            })
                                        }
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white hover:shadow-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteCategory(category.id)}
                                        className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No brands found. Create one to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
}
