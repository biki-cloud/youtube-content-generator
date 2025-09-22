"use client";

import { useState, useEffect, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  data: {
    imageKey?: string;
    thumbnailImageKey?: string;
    musicKey?: string;
    videoKey?: string;
    youtubeVideoId?: string;
    youtubeUrl?: string;
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: "public" | "private" | "unlisted";
  };
}

interface SavedProjectsProps {
  onLoadProject?: (project: Project) => void;
  onSaveProject?: (projectData: Partial<Project["data"]>) => void;
}

export default function SavedProjects({
  onLoadProject,
  onSaveProject,
}: SavedProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (res.ok) {
        setProjects(json.projects);
      } else {
        setError(json.error || "Failed to load projects");
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      setError("Project name is required");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setProjects((prev) => [json.project, ...prev]);
        setNewProjectName("");
        setNewProjectDescription("");
      } else {
        setError(json.error || "Failed to create project");
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, newProjectDescription]);

  const deleteProject = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        const json = await res.json();
        setError(json.error || "Failed to delete project");
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    }
  }, []);

  const loadProject = useCallback(
    async (project: Project) => {
      onLoadProject?.(project);
    },
    [onLoadProject]
  );

  const saveCurrentProject = useCallback(
    async (projectData: Partial<Project["data"]>) => {
      onSaveProject?.(projectData);
    },
    [onSaveProject]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <section style={{ border: "1px solid #ddd", padding: 16 }}>
      <h3>保存されたプロジェクト</h3>

      {/* Create New Project */}
      <div
        style={{
          marginBottom: 20,
          padding: 12,
          backgroundColor: "#f9f9f9",
          borderRadius: 4,
        }}
      >
        <h4>Create New Project</h4>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            type="text"
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
          <button
            onClick={createProject}
            disabled={!newProjectName.trim() || isCreating}
            style={{
              padding: "8px 16px",
              backgroundColor: isCreating ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isCreating ? "not-allowed" : "pointer",
            }}
          >
            {isCreating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            color: "red",
            padding: 8,
            backgroundColor: "#ffe6e6",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Projects List */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h4>Projects ({projects.length})</h4>
          <button
            onClick={loadProjects}
            disabled={loading}
            style={{
              padding: "4px 8px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {projects.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No projects saved yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 12,
                  borderRadius: 4,
                  backgroundColor: "#fafafa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>
                      {project.name}
                    </h5>
                    {project.description && (
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        {project.description}
                      </p>
                    )}
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      <div>Created: {formatDate(project.createdAt)}</div>
                      <div>Updated: {formatDate(project.updatedAt)}</div>
                      <div>
                        Assets:{" "}
                        {[
                          project.data.imageKey && "Image",
                          project.data.musicKey && "Music",
                          project.data.videoKey && "Video",
                          project.data.thumbnailImageKey && "Thumbnail",
                          (project.data.youtubeVideoId ||
                            project.data.youtubeUrl) &&
                            "YouTube",
                        ]
                          .filter(Boolean)
                          .join(", ") || "None"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
                    <button
                      onClick={() => loadProject(project)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
