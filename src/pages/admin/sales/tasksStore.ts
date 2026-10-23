import { salesApiClient } from '../../../services/salesApi';

/* Sales tasks — shared by the Tasks page and the Sales notifications bell. Saved on the server
   (/sales/tasks, the sales person's own list); kept in memory here so both read the same copy. */

export type TaskPriority = 'high' | 'medium' | 'low';

export interface SalesTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;        // yyyy-mm-dd
  priority: TaskPriority;
  relatedTo?: string;  // seller / lead name
  done: boolean;
  createdAt: string;
  completedAt?: string;
}

export const TASKS_CHANGED_EVENT = 'qp-sales-tasks-changed';
const cache = new Map<string, SalesTask[]>();

export function readTasks(owner: string): SalesTask[] {
  return cache.get(owner || 'me') || [];
}

/** Fetches the list from the server (once per call) and refreshes everyone reading it */
export async function loadTasks(owner: string): Promise<SalesTask[]> {
  try {
    const res = await salesApiClient.get('/tasks');
    const tasks: SalesTask[] = res.data?.tasks || [];
    cache.set(owner || 'me', tasks);
    window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
    return tasks;
  } catch {
    return readTasks(owner);
  }
}

/** Saves the whole list; the screen updates at once and the server copy follows */
export function writeTasks(owner: string, tasks: SalesTask[]): Promise<boolean> {
  cache.set(owner || 'me', tasks);
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
  return salesApiClient.put('/tasks', { tasks }).then(() => true, () => false);
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
