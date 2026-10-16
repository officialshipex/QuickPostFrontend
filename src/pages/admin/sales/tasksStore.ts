/* Sales tasks storage — shared by the Tasks page and the Sales notifications bell.
   Kept in this browser per employee until the Sales backend exposes `/sales/tasks`. */

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
const storageKey = (owner: string) => `qp_sales_tasks:${owner || 'me'}`;

export function readTasks(owner: string): SalesTask[] {
  try { return JSON.parse(localStorage.getItem(storageKey(owner)) || '[]'); } catch { return []; }
}

export function writeTasks(owner: string, tasks: SalesTask[]) {
  try { localStorage.setItem(storageKey(owner), JSON.stringify(tasks)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}

export const todayStr = () => new Date().toISOString().slice(0, 10);
