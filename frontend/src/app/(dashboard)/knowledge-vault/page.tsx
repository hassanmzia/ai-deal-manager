"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDocuments } from "@/services/knowledge-vault";
import { KnowledgeDocument, DocumentCategory } from "@/types/knowledge-vault";
import {
  Loader2,
  Search,
  LayoutGrid,
  List,
  Upload,
  FileText,
  CheckCircle2,
  Files,
} from "lucide-react";

const CATEGORY_STYLES: Record<DocumentCategory, string> = {
  template: "bg-orange-100 text-orange-700",
  guide: "bg-blue-100 text-blue-700",
  best_practice: "bg-teal-100 text-teal-700",
  case_study: "bg-green-100 text-green-700",
  regulatory_reference: "bg-red-100 text-red-700",
  tool: "bg-yellow-100 text-yellow-700",
  lesson_learned: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  template: "Template",
  guide: "Guide",
  best_practice: "Best Practice",
  case_study: "Case Study",
  regulatory_reference: "Regulatory Ref",
  tool: "Tool",
  lesson_learned: "Lesson Learned",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-500",
};

const ALL_CATEGORIES: DocumentCategory[] = [
  "template",
  "guide",
  "best_practice",
  "case_study",
  "regulatory_reference",
  "tool",
  "lesson_learned",
  "other",
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(str: string, maxLen: number): string {
  if (!str) return "--";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

export default function KnowledgeVaultPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const data = await getDocuments(params);
      setDocuments(data.results || []);
    } catch (err) {
      setError("Failed to load documents. Please try again.");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const approvedCount = documents.filter((d) => d.status === "approved").length;

  // Count by category (from current results)
  const categoryBreakdown = ALL_CATEGORIES.map((cat) => ({
    category: cat,
    count: documents.filter((d) => d.category === cat).length,
  })).filter((item) => item.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Vault</h1>
          <p className="text-muted-foreground">
            Centralized repository for documents, templates, and best practices
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Files className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{categoryBreakdown.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Types</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <div className="flex items-center rounded-md border border-input">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center h-9 w-9 rounded-l-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center h-9 w-9 rounded-r-md transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading documents...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchDocuments}>
            Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No documents found matching your filters.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {doc.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      CATEGORY_STYLES[doc.category] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {CATEGORY_LABELS[doc.category] || doc.category}
                  </span>
                </div>

                {doc.description && (
                  <p className="text-xs text-muted-foreground">
                    {truncate(doc.description, 100)}
                  </p>
                )}

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 4).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[doc.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <span>v{doc.version}</span>
                  </div>
                  <span>{formatDate(doc.created_at)}</span>
                </div>

                {doc.author_name && (
                  <p className="text-xs text-muted-foreground">
                    By {doc.author_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Documents
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({documents.length} results)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Version
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Tags
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {truncate(doc.title, 50)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            CATEGORY_STYLES[doc.category] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[doc.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {doc.status.charAt(0).toUpperCase() +
                            doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        v{doc.version}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(doc.tags || []).slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
