import useSWR from 'swr';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: { username: string; avatar: string | null };
  prodi: string | null;
  kelas: string | null;
  isPinned: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function useAnnouncements(prodi?: string | null, kelas?: string | null) {
  const params = new URLSearchParams();
  if (prodi) params.set('prodi', prodi);
  if (kelas) params.set('kelas', kelas);
  
  const query = params.toString();
  const url = `/api/announcements${query ? `?${query}` : ''}`;
  
  const { data, error, mutate } = useSWR<{ announcements: Announcement[] }>(
    url,
    async (fetchUrl: string) => {
      const res = await fetch(fetchUrl);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat pengumuman");
      }
      return json;
    },
  );
  
  return {
    announcements: data?.announcements ?? [],
    isLoading: !data && !error,
    mutate,
  };
}
