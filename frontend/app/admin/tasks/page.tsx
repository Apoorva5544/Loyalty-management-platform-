"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await apiClient.getTasks();
            setTasks(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await apiClient.deleteTask(id);
                loadTasks();
            } catch (error) {
                alert("Failed to delete task");
            }
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-500 mt-1">Manage earning opportunities for customers</p>
                </div>
                <button
                    className="flex items-center gap-2 px-6 py-2 text-white rounded-lg font-medium"
                    style={{ backgroundColor: '#007bff' }}
                >
                    <Plus className="h-4 w-4" />
                    Add Task
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Task Label
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Points
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {task.label}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{task.type}</td>
                                <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#007bff' }}>
                                    {task.points} pts
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
