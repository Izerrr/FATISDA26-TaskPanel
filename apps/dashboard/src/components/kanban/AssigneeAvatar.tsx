interface Props {
  user: { id: string; username: string; avatar: string | null };
  size?: "sm" | "md";
}

export function AssigneeAvatar({ user, size = "sm" }: Props) {
  const cls = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        title={user.username}
        className={`${cls} rounded-lg object-cover ring-1 ring-black/[0.06]`}
      />
    );
  }
  return (
    <div title={user.username} className={`${cls} flex items-center justify-center rounded-lg bg-liquid-accent font-bold text-white`}>
      {user.username.charAt(0).toUpperCase()}
    </div>
  );
}
