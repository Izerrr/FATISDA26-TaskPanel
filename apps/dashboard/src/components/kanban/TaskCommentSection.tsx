"use client";

import { useState } from "react";
import { useTaskComments } from "@/hooks/useTaskComments";
import { Loader2, Send } from "lucide-react";
import Image from "next/image";
import { formatRelativeWib } from "@/lib/datetime";

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
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Komentar</h3>

      <div className="flex flex-col space-y-3 max-h-60 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-liquid-accent" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Belum ada komentar.</p>
        ) : (
          comments.map((comment) => {
            const displayName = comment.author.name || comment.author.username;
            return (
              <div key={comment.id} className="flex items-start space-x-2.5">
                {comment.author.avatar ? (
                  <Image
                    src={comment.author.avatar}
                    alt={displayName}
                    width={28}
                    height={28}
                    className="rounded-xl w-7 h-7 object-cover shrink-0 mt-0.5 ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-liquid-accent/15 text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-2.5 sm:p-3 rounded-2xl rounded-tl-sm w-full min-w-0">
                  <div className="flex flex-wrap justify-between items-center gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </span>
                      {comment.author.name && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          @{comment.author.username}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                      {formatRelativeWib(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words min-w-0">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2 mt-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tulis komentar..."
          className="flex-1 min-w-0 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-liquid-accent/30 focus:border-liquid-accent dark:focus:border-sky-500"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="p-2.5 min-w-[38px] min-h-[38px] flex items-center justify-center shrink-0 bg-liquid-accent text-white rounded-full hover:brightness-95 disabled:opacity-50 transition-all active:scale-95"
          aria-label="Kirim komentar"
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
