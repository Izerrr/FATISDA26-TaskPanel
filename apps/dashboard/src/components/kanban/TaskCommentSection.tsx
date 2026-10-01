"use client";

import { useState } from "react";
import { useTaskComments } from "@/hooks/useTaskComments";
import { Loader2, Send } from "lucide-react";
import Image from "next/image";

export function TaskCommentSection({ taskId }: { taskId: string }) {
  const { comments, isLoading, mutate } = useTaskComments(taskId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        mutate();
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 mt-4">
      <h3 className="text-sm font-semibold text-liquid-text">Komentar</h3>
      
      <div className="flex flex-col space-y-3 max-h-60 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-liquid-accent" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Belum ada komentar.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              {comment.author.avatar ? (
                <Image
                  src={comment.author.avatar}
                  alt={comment.author.username}
                  width={24}
                  height={24}
                  className="rounded-full w-6 h-6 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              )}
              <div className="flex flex-col bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl rounded-tl-none w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-liquid-text">
                    {comment.author.username}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-liquid-text whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2 mt-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tulis komentar..."
          className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-liquid-border px-3 py-2 text-xs text-liquid-text focus:outline-none focus:ring-1 focus:ring-liquid-accent"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="p-2 bg-liquid-accent text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
