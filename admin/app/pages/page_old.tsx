"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { defaultProps } from "./builder/config";
import { PageEditorPane } from "./builder/PageEditorPane";
import { PagesSidebar } from "./builder/PagesSidebar";
import type { Block } from "./builder/types";
import { usePages } from "./builder/usePages";
import { backendBaseUrl } from "@/lib/urls";
import Swal from "sweetalert2";

const API_URL = backendBaseUrl;

const createBlock = (type: string): Block => ({
  uid: crypto.randomUUID(),
  type,
  props: JSON.parse(JSON.stringify(defaultProps[type] || {})),
});

export default function PagesBuilder() {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeElementLabel, setActiveElementLabel] = useState<string | null>(
    null
  );
  const [previewMenuOpen, setPreviewMenuOpen] = useState(true);
  const backendMissing = !API_URL;
  const {
    pages,
    activePage,
    statusMessage,
    selectPage,
    createPage,
    updatePage,
    savePage,
    deletePage,
  } = usePages({ createBlock });

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    const data = await response.json();
    return data.url as string;
  };

  // Handle save with SweetAlert notification
  const handleSave = async () => {
    await savePage();
    
    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Page has been saved successfully",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  // Handle delete with confirmation modal
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      await deletePage();
      
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Page has been deleted",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };


  const updateBlockProps = (
    index: number,
    patch: Record<string, unknown>
  ) => {
    if (!activePage) return;
    const next = [...activePage.layout];
    next[index] = {
      ...next[index],
      props: { ...next[index].props, ...patch },
    };
    updatePage({ layout: next });
  };

  const addBlock = (type: string) => {
    if (!activePage) return;
    updatePage({ layout: [...activePage.layout, createBlock(type)] });
  };

  const insertBlock = (type: string, index: number) => {
    if (!activePage) return;
    const next = [...activePage.layout];
    const safeIndex = Math.max(0, Math.min(index, next.length));
    next.splice(safeIndex, 0, createBlock(type));
    updatePage({ layout: next });
  };

  const removeBlock = (index: number) => {
    if (!activePage) return;
    const next = [...activePage.layout];
    next.splice(index, 1);
    updatePage({ layout: next });
  };

  const onDragEnd = (event: { active: { id: string }; over?: { id: string } }) => {
    if (!activePage || !event.over) return;
    const oldIndex = activePage.layout.findIndex(
      (block) => block.uid === event.active.id
    );
    const newIndex = activePage.layout.findIndex(
      (block) => block.uid === event.over?.id
    );
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    updatePage({
      layout: arrayMove(activePage.layout, oldIndex, newIndex),
    });
  };


  const activeLayout = useMemo(() => activePage?.layout || [], [activePage]);

  const reorderBlocks = (oldIndex: number, newIndex: number) => {
    if (!activePage) return;
    const nextLayout = arrayMove(activePage.layout, oldIndex, newIndex);
    let nextActive = activeBlockIndex;
    if (nextActive !== null) {
      if (nextActive === oldIndex) {
        nextActive = newIndex;
      } else if (
        nextActive >= Math.min(oldIndex, newIndex) &&
        nextActive <= Math.max(oldIndex, newIndex)
      ) {
        nextActive = oldIndex < newIndex ? nextActive - 1 : nextActive + 1;
      }
    }
    setActiveBlockIndex(nextActive);
    updatePage({ layout: nextLayout });
  };

  return (
    <div>
      {backendMissing && (
        <div className="mx-auto mb-4 max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Backend URL ไม่พร้อมใช้งาน: ตั้งค่า{" "}
          <span className="font-semibold">
            NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL
          </span>{" "}
          ใน <span className="font-semibold">admin/.env</span> แล้ว restart
          admin server
        </div>
      )}
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_1fr]">
        <PagesSidebar
          pages={pages}
          activePageId={activePage?.id}
          onSelectPage={selectPage}
          onCreatePage={createPage}
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          {!activePage ? (
            <p className="text-sm text-slate-500">
              เลือกหน้าเพื่อแก้ไข หรือสร้างหน้าใหม่
            </p>
          ) : (
            <PageEditorPane
              page={activePage}
              blocks={activeLayout}
              statusMessage={statusMessage}
              activeBlockIndex={activeBlockIndex}
              activeElementLabel={activeElementLabel}
              previewOpen={previewOpen}
              previewMenuOpen={previewMenuOpen}
              onOpenPreview={() => setPreviewOpen(true)}
              onClosePreview={() => setPreviewOpen(false)}
              onTogglePreviewMenu={() => setPreviewMenuOpen((prev) => !prev)}
              onSave={handleSave}
              onDelete={handleDelete}
              onUpdatePage={updatePage}
              onAddBlock={addBlock}
              onInsertBlock={insertBlock}
              onRemoveBlock={removeBlock}
              onDragEnd={onDragEnd}
              onSelectBlock={(index) => setActiveBlockIndex(index)}
              onElementSelect={(label) => setActiveElementLabel(label)}
              onClearSelection={() => {
                setActiveBlockIndex(null);
                setActiveElementLabel(null);
              }}
              onReorder={reorderBlocks}
              updateBlockProps={updateBlockProps}
              uploadImage={uploadImage}
            />
          )}
        </section>
      </div>
    </div>
  );
}
