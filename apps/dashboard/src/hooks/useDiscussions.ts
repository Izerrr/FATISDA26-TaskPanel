"use client";

import useSWR from "swr";

export interface DiscussionReplyItem {
  id: string;
  discussionId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  createdAt: string;
}

export interface CourseDiscussionItem {
  id: string;
  courseId: string | null;
  courseName: string | null;
  prodi: string | null;
  kelas: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  replies: DiscussionReplyItem[];
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDiscussions(courseId?: string | null, courseName?: string | null) {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (courseName) params.set("courseName", courseName);

  const key = `/api/discussions?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ discussions: CourseDiscussionItem[] }>(
    key,
    fetcher
  );

  return {
    discussions: data?.discussions ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}

