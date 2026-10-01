import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  author: { id: string; username: string; avatar: string | null };
  content: string;
  createdAt: string;
}

export function useTaskComments(taskId: string | null) {
  const { data, error, mutate } = useSWR<{ comments: TaskComment[] }>(
    taskId ? `/api/tasks/${taskId}/comments` : null,
    fetcher
  );
  return {
    comments: data?.comments ?? [],
    isLoading: !data && !error,
    mutate,
  };
}
