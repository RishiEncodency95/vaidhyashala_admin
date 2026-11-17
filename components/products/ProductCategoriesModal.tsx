"use client";

import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import Modal from "@/components/ui/Modal";
import { ApiRequestError } from "@/lib/api";
import { productsApi, type ProductCategory } from "@/lib/productsApi";
import { Toggle } from "@/components/pages-cms/fields";

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiRequestError || err instanceof Error ? err.message || fallback : fallback;

const INPUT =
  "h-[32px] w-full rounded-[5px] border border-[#e5e6e2] bg-white px-2 text-[12px] font-medium text-[#414b5e] outline-none focus:border-[#8fa98e]";

function CategoryRow({ category, onSaved, onDeleted }: { category: ProductCategory; onSaved: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(category.name);
  const [order, setOrder] = useState(String(category.order ?? ""));
  const [busy, setBusy] = useState(false);
  const dirty = name.trim() !== category.name || order.trim() !== String(category.order ?? "");

  const save = async (patch?: { isActive: boolean }) => {
    if (!name.trim()) return Swal.fire({ title: "Please enter a category name", icon: "warning" });
    if (order.trim() && !/^\d+$/.test(order.trim())) return Swal.fire({ title: "Order must be a whole number", icon: "warning" });
    setBusy(true);
    try {
      await productsApi.updateCategory(category._id, {
        name: name.trim(),
        ...(order.trim() ? { order: Number(order.trim()) } : {}),
        ...patch,
      });
      onSaved();
    } catch (err) {
      Swal.fire({ title: "Could not save the category", text: errorText(err, "Please try again."), icon: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const result = await Swal.fire({
      title: `Delete "${category.name}"?`,
      text: "Only a category without products can be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    setBusy(true);
    try {
      await productsApi.deleteCategory(category._id);
      onDeleted();
    } catch (err) {
      Swal.fire({ title: "Could not delete the category", text: errorText(err, "Please try again."), icon: "error" });
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-[#f0f0ec]">
      <td className="py-2 pr-2">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={INPUT} />
      </td>
      <td className="w-[70px] py-2 pr-2">
        <input value={order} onChange={(e) => setOrder(e.target.value)} maxLength={4} className={`${INPUT} text-center`} />
      </td>
      <td className="w-[70px] py-2 pr-2 text-center text-[12px] font-semibold text-[#6c7587]">{category.productCount ?? 0}</td>
      <td className="w-[80px] py-2 pr-2">
        <div className="flex justify-center">
          <Toggle checked={category.isActive} onChange={(v) => save({ isActive: v })} />
        </div>
      </td>
      <td className="w-[90px] py-2">
        <div className="flex items-center justify-end gap-1.5">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#6c7587]" />
          ) : (
            <>
              {dirty && (
                <button
                  type="button"
                  onClick={() => save()}
                  title="Save"
                  className="flex h-[26px] items-center gap-1 rounded-[5px] bg-[#166b40] px-2 text-[11px] font-bold text-white hover:bg-[#12593a]"
                >
                  <Save className="h-3 w-3" /> Save
                </button>
              )}
              <button
                type="button"
                onClick={remove}
                title="Delete category"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/** Add, rename, reorder, hide or delete the filter categories of the Products page */
export default function ProductCategoriesModal({
  isOpen,
  onClose,
  categories,
  onChanged,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await productsApi.createCategory({ name: newName.trim() });
      setNewName("");
      onChanged();
    } catch (err) {
      Swal.fire({ title: "Could not add the category", text: errorText(err, "Please try again."), icon: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Categories"
      size="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-[32px] rounded-[5px] border border-[#e5e6e2] bg-white px-4 text-[12px] font-bold text-[#414b5e] hover:bg-slate-50"
        >
          Done
        </button>
      }
    >
      <p className="mb-3 text-[12px] font-medium text-[#6c7587]">
        Categories are the filter buttons above the products on the website. A hidden category hides its products too.
      </p>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#e8e5df] text-[10.5px] font-bold uppercase tracking-wide text-[#6c7587]">
            <th className="py-1.5 pr-2">Name</th>
            <th className="py-1.5 pr-2 text-center">Order</th>
            <th className="py-1.5 pr-2 text-center">Products</th>
            <th className="py-1.5 pr-2 text-center">Visible</th>
            <th className="py-1.5" />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            // Keyed on the saved values so a row resets after its save reloads the list
            <CategoryRow key={`${c._id}-${c.name}-${c.order}-${c.isActive}`} category={c} onSaved={onChanged} onDeleted={onChanged} />
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-[12px] text-[#6c7587]">
                No categories yet. Add the first one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={80}
          placeholder="New category name, e.g. Therapy Oils"
          className={INPUT}
        />
        <button
          type="button"
          onClick={add}
          disabled={adding || !newName.trim()}
          className="inline-flex h-[32px] shrink-0 items-center gap-1 rounded-[5px] bg-[#166b40] px-3 text-[12px] font-bold text-white hover:bg-[#12593a] disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add
        </button>
      </div>
    </Modal>
  );
}
