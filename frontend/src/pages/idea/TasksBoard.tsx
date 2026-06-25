/**
 * pages/idea/TasksBoard.tsx
 * Interactive Team Collaboration Kanban Board with real-time WebSocket reload integration.
 */

import { useState, useEffect } from 'react';
import { apiService, type Task, type Idea } from '../../shared/lib/api';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare, 
  FileText, 
  Sparkles,
  X
} from 'lucide-react';

interface TasksBoardProps {
  idea: Idea;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'border-slate-500/20 text-slate-300 bg-slate-500/5' },
  { id: 'in_progress', title: 'In Progress', color: 'border-indigo-500/20 text-indigo-300 bg-indigo-500/5' },
  { id: 'review', title: 'In Review', color: 'border-amber-500/20 text-amber-300 bg-amber-500/5' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/20 text-emerald-300 bg-emerald-500/5' },
];

export default function TasksBoard({ idea }: TasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createColumn, setCreateColumn] = useState('todo');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Assignee options list (Founder + Teammates)
  const assignees = [
    { userId: idea.founderId, name: idea.founderName, roleTitle: 'Founder' },
    ...(idea.teamMembers || [])
  ];

  // Fetch tasks
  const loadTasks = async () => {
    try {
      const list = await apiService.getTasks(idea.id);
      setTasks(list);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on mount and setup real-time reload listeners
  useEffect(() => {
    loadTasks();

    const handleWsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.ideaId === idea.id) {
        console.log('🔄 Tasks change event received via WS. Reloading tasks...');
        loadTasks();
      }
    };

    window.addEventListener('invesa_task_update', handleWsUpdate);
    return () => {
      window.removeEventListener('invesa_task_update', handleWsUpdate);
    };
  }, [idea.id]);

  // Open creation modal
  const handleOpenCreate = (colId: string) => {
    setCreateColumn(colId);
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setDueDate('');
    setIsCreateOpen(true);
  };

  // Handle task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const payload = {
        title,
        description,
        status: createColumn,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        position: tasks.filter(t => t.status === createColumn).length,
      };

      const created = await apiService.createTask(idea.id, payload);
      setTasks(prev => [...prev, created]);
      setIsCreateOpen(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Open detailed view modal
  const handleOpenDetail = (task: Task) => {
    setActiveTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssigneeId(task.assigneeId || '');
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setIsDetailOpen(true);
  };

  // Handle task updates (save detailed edits)
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !title.trim()) return;

    try {
      const payload = {
        title,
        description,
        status: activeTask.status,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        position: activeTask.position,
      };

      const updated = await apiService.updateTask(idea.id, activeTask.id, payload);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setIsDetailOpen(false);
      setActiveTask(null);
    } catch (err) {
      console.error('Failed to update task detail:', err);
    }
  };

  // Quick move status (left/right column buttons)
  const handleMoveStatus = async (task: Task, direction: 'left' | 'right') => {
    const colOrder = ['todo', 'in_progress', 'review', 'done'];
    const currentIndex = colOrder.indexOf(task.status);
    let nextIndex = currentIndex + (direction === 'left' ? -1 : 1);
    
    if (nextIndex < 0 || nextIndex >= colOrder.length) return;
    const nextStatus = colOrder[nextIndex];

    try {
      const payload = {
        title: task.title,
        description: task.description,
        status: nextStatus,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        position: tasks.filter(t => t.status === nextStatus).length,
      };

      const updated = await apiService.updateTask(idea.id, task.id, payload);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      console.error('Failed to shift task status:', err);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiService.deleteTask(idea.id, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsDetailOpen(false);
      setActiveTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Find assignee name or initials
  const getAssigneeInfo = (id: string | null | undefined) => {
    if (!id) return null;
    const found = assignees.find(a => a.userId === id);
    if (!found) return { name: 'Teammate', initials: 'T' };
    const initials = found.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    return { name: found.name, role: found.roleTitle, initials };
  };

  // Render colored assignee badge
  const renderAssigneeBadge = (id: string | null | undefined) => {
    const info = getAssigneeInfo(id);
    if (!info) return null;
    return (
      <div className="flex items-center gap-1.5" title={`${info.name} (${info.role})`}>
        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300">
          {info.initials}
        </div>
        <span className="text-[10px] text-white/50 truncate max-w-[80px]">
          {info.name.split(' ')[0]}
        </span>
      </div>
    );
  };

  // Filter tasks based on search
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if a task is overdue
  const isOverdue = (dueDateStr: string | null | undefined, status: string) => {
    if (!dueDateStr || status === 'done') return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return due < today;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-white/40 text-xs">
        Loading project Kanban board...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-semibold tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Multiplayer Enabled</span>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl p-3 min-h-[400px]">
              
              {/* Column Header */}
              <div className={`flex items-center justify-between pb-3 mb-3 border-b border-white/5 ${col.color.split(' ')[1]}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm tracking-tight">{col.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 font-bold">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenCreate(col.id)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleOpenDetail(task)}
                        className={`group relative bg-white/[0.02] hover:bg-white/[0.04] border rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-200 cursor-pointer ${
                          overdue ? 'border-red-500/30 hover:border-red-500/40 bg-red-500/[0.02]' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Title & Description */}
                        <div>
                          <h4 className="font-semibold text-xs text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Card Footer Info */}
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                          {/* Assignee */}
                          <div className="flex-1 min-w-0">
                            {task.assigneeId ? renderAssigneeBadge(task.assigneeId) : (
                              <span className="text-[9px] text-white/20 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Unassigned
                              </span>
                            )}
                          </div>

                          {/* Due Date Indicator */}
                          {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[9px] ${
                              overdue ? 'text-red-400 font-semibold' : 'text-white/30'
                            }`}>
                              <Calendar className="w-2.5 h-2.5" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick Card Controls overlay on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-surface-default/90 rounded-lg p-0.5 border border-white/10 shadow-lg" onClick={e => e.stopPropagation()}>
                          {col.id !== 'todo' && (
                            <button
                              onClick={() => handleMoveStatus(task, 'left')}
                              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              onClick={() => handleMoveStatus(task, 'right')}
                              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl text-white/20 text-[10px]">
                    No tasks here.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Create Task */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-default border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-bold text-sm text-white">Create New Task</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTask} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Provide details about the task..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {assignees.map(a => (
                      <option key={a.userId} value={a.userId}>{a.name} ({a.roleTitle})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 hover:bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Task Details & Edit */}
      {isDetailOpen && activeTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-default border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-bold text-sm text-white">Task Details</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(activeTask.id)}
                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsDetailOpen(false); setActiveTask(null); }} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form / Details */}
            <form onSubmit={handleSaveEdits} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {assignees.map(a => (
                      <option key={a.userId} value={a.userId}>{a.name} ({a.roleTitle})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[10px] text-white/30 pt-2">
                <div className="flex justify-between">
                  <span>Creator:</span>
                  <span className="font-semibold text-white/40">
                    {assignees.find(a => a.userId === activeTask.creatorId)?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(activeTask.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(activeTask.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsDetailOpen(false); setActiveTask(null); }}
                  className="px-4 py-2 hover:bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
