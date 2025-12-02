// frontend/src/components/TaskActions.jsx
// BUG #9 FIX: Correct state updates avec nouvelles références

import React, { useState } from 'react';

export const TaskActions = ({ task, tasks, setTasks, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  // BUG #9 FIX: Supprimer une tâche correctement
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // ✅ Créer une NOUVELLE référence de tableau (immutable)
      setTasks(prevTasks => 
        prevTasks.filter(t => t._id !== taskId)
      );

      // Toast/notification
      window.showSuccessMessage?.('Tâche supprimée');
    } catch (error) {
      console.error('Delete error:', error);
      onError?.(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  // BUG #9 FIX: Marquer comme complétée correctement
  const handleToggleTask = async (taskId, currentCompleted) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ completed: !currentCompleted })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedTask = await response.json();

      // ✅ Créer une NOUVELLE référence de tableau
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t._id === taskId ? { ...t, ...updatedTask } : t
        )
      );

      window.showSuccessMessage?.(
        updatedTask.completed 
          ? 'Tâche marquée comme complétée' 
          : 'Tâche marquée comme non complétée'
      );
    } catch (error) {
      console.error('Toggle error:', error);
      onError?.(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // BUG #9 FIX: Éditer une tâche
  const handleEditTask = async (taskId, updatedData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      const updatedTask = await response.json();

      // ✅ Créer une NOUVELLE référence de tableau
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t._id === taskId ? { ...t, ...updatedTask } : t
        )
      );

      window.showSuccessMessage?.('Tâche mise à jour');
    } catch (error) {
      console.error('Edit error:', error);
      onError?.(error.message || 'Erreur lors de la modification');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleDeleteTask,
    handleToggleTask,
    handleEditTask,
    isLoading
  };
};

export default TaskActions;

