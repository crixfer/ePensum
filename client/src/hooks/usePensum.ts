import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PensumImportPayload, PensumTemplateListItem, PensumView } from "@epensum/shared";
import { api, ApiError } from "@/lib/api";

const PENSUM_KEY = ["me", "pensum"];
const TEMPLATES_KEY = ["pensum-templates"];

export function usePensum() {
  return useQuery({
    queryKey: PENSUM_KEY,
    queryFn: () => api.get<PensumView>("/me/pensum"),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return false;
      return failureCount < 2;
    },
  });
}

interface SubjectUpdate {
  status?: string;
  finalScore?: number | null;
  teacher?: string | null;
  completedDate?: string | null;
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, update }: { subjectId: string; update: SubjectUpdate }) =>
      api.patch<PensumView>(`/me/pensum/subjects/${subjectId}`, update),
    onSuccess: (data) => {
      queryClient.setQueryData(PENSUM_KEY, data);
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: () => api.get<PensumTemplateListItem[]>("/pensum-templates"),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => api.delete(`/pensum-templates/${templateId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useAttachTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => api.post(`/pensum-templates/${templateId}/attach`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PENSUM_KEY }),
  });
}

export function useImportPensum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PensumImportPayload) => api.post("/pensum-templates/import", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PENSUM_KEY }),
  });
}

export function useDetachPensum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/me/pensum"),
    // Remove (not just invalidate) the cached pensum: invalidating alone would still
    // serve the stale deleted-pensum data to the next page while it refetches in the
    // background, which briefly bounces OnboardingPage back to "/" before it 404s.
    onSuccess: () => queryClient.removeQueries({ queryKey: PENSUM_KEY }),
  });
}
