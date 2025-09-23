import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/env/schema";
import { logInfo, logError } from "@/lib/logger";

const env = getEnv();
const PROJECTS_FILE = path.join(env.DATA_DIR, "projects.json");

export interface GeneratedPrompts {
  theme: string;
  music: string;
  thumbnail: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  generatedAt: number;
}

export interface Project {
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
    prompts?: GeneratedPrompts;
  };
}

interface ProjectsData {
  projects: Project[];
}

function loadProjects(): ProjectsData {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      logInfo("Projects file does not exist, returning empty projects", {
        projectsFile: PROJECTS_FILE,
      });
      return { projects: [] };
    }
    const content = fs.readFileSync(PROJECTS_FILE, "utf8");
    const data = JSON.parse(content);
    logInfo("Projects loaded successfully", {
      projectCount: data.projects?.length || 0,
    });
    return data;
  } catch (error) {
    logError("Error loading projects", error, { projectsFile: PROJECTS_FILE });
    return { projects: [] };
  }
}

function saveProjects(data: ProjectsData): void {
  try {
    fs.mkdirSync(path.dirname(PROJECTS_FILE), { recursive: true });
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2), "utf8");
    logInfo("Projects saved successfully", {
      projectCount: data.projects.length,
    });
  } catch (error) {
    logError("Error saving projects", error, { projectsFile: PROJECTS_FILE });
    throw new Error("Failed to save projects");
  }
}

export function getAllProjects(): Project[] {
  const data = loadProjects();
  return data.projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id: string): Project | null {
  const data = loadProjects();
  return data.projects.find((p) => p.id === id) || null;
}

export function createProject(name: string, description?: string): Project {
  logInfo("Creating new project", { name, description });
  const data = loadProjects();
  const now = Date.now();

  const project: Project = {
    id: randomUUID(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    data: {},
  };

  data.projects.push(project);
  saveProjects(data);
  logInfo("Project created successfully", {
    projectId: project.id,
    name: project.name,
  });
  return project;
}

export function updateProject(
  id: string,
  updates: Partial<Project>
): Project | null {
  const data = loadProjects();
  const projectIndex = data.projects.findIndex((p) => p.id === id);

  if (projectIndex === -1) {
    return null;
  }

  const project = data.projects[projectIndex];
  const updatedProject = {
    ...project,
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: Date.now(),
  };

  data.projects[projectIndex] = updatedProject;
  saveProjects(data);
  return updatedProject;
}

export function deleteProject(id: string): boolean {
  const data = loadProjects();
  const initialLength = data.projects.length;
  data.projects = data.projects.filter((p) => p.id !== id);

  if (data.projects.length < initialLength) {
    saveProjects(data);
    return true;
  }
  return false;
}

export function saveProjectData(
  id: string,
  projectData: Partial<Project["data"]>
): Project | null {
  const project = getProject(id);
  if (!project) {
    return null;
  }

  return updateProject(id, {
    data: {
      ...project.data,
      ...projectData,
    },
  });
}
