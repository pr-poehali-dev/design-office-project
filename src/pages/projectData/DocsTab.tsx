import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/lib/queries";
import { EmptyState } from "./shared";
import type { Document } from "./shared";

type DocFilter = "all" | "uploaded" | "generated";

export default function DocsTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isDesigner = user?.role === "designer";

  const { data, isLoading } = useDocuments(projectId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const documents: Document[] = data?.documents || [];

  const [filter, setFilter] = useState<DocFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = filter === "all" ? documents : documents.filter(d => d.type === filter);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const ext = file.name.split(".").pop() || "pdf";
      uploadMutation.mutate({
        projectId,
        data: {
          title: file.name,
          file: base64,
          content_type: file.type,
          ext,
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDelete = (docId: string) => {
    deleteMutation.mutate({ projectId, docId });
  };

  const getDownloadUrl = (doc: Document) => doc.signed_url || doc.generated_url || "";

  const formatDate = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  const filterTabs: { id: DocFilter; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "uploaded", label: "Загруженные" },
    { id: "generated", label: "Сгенерированные" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" size={22} className="text-terra animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === tab.id ? "bg-white text-stone shadow-sm" : "text-stone-mid hover:text-stone"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {isDesigner && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all disabled:opacity-60"
            >
              <Icon name="Upload" size={14} />
              {uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.svg"
            />
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          title="Документов пока нет"
          subtitle="Загрузите файлы проекта"
          action={isDesigner ? "Загрузить документ" : undefined}
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {filtered.map(doc => {
            const url = getDownloadUrl(doc);
            const ext = doc.title?.split(".").pop()?.toUpperCase() || "FILE";
            return (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.type === "generated" ? "bg-blue-50" : "bg-muted"}`}>
                  <Icon name={doc.type === "generated" ? "FileText" : "File"} size={18} className={doc.type === "generated" ? "text-blue-600" : "text-stone-light"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-stone-light">
                    <span className="uppercase">{ext}</span>
                    {doc.created_at && (
                      <>
                        <span>&middot;</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </>
                    )}
                    {doc.type === "generated" && (
                      <>
                        <span>&middot;</span>
                        <span className="text-blue-600">Сгенерирован</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-muted text-stone-light hover:text-terra transition-all">
                      <Icon name="Download" size={16} />
                    </a>
                  )}
                  {isDesigner && (
                    <button onClick={() => handleDelete(doc.id)} disabled={deleteMutation.isPending} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-light hover:text-red-500 transition-all">
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
