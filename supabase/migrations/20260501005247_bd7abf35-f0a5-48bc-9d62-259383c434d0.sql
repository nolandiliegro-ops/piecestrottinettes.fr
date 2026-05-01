-- Table watcher_runs : tracking des runs de l'agent Le Veilleur
CREATE TABLE public.watcher_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  scooters_found INTEGER NOT NULL DEFAULT 0,
  parts_found INTEGER NOT NULL DEFAULT 0,
  scooters_inserted INTEGER NOT NULL DEFAULT 0,
  parts_inserted INTEGER NOT NULL DEFAULT 0,
  scooters_skipped INTEGER NOT NULL DEFAULT 0,
  parts_skipped INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_log TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'cron',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_watcher_runs_run_date ON public.watcher_runs(run_date DESC);
CREATE INDEX idx_watcher_runs_status ON public.watcher_runs(status);

ALTER TABLE public.watcher_runs ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent consulter (le service_role bypass RLS pour les inserts/updates depuis le script)
CREATE POLICY "Admins can view watcher runs"
ON public.watcher_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_watcher_runs_updated_at
BEFORE UPDATE ON public.watcher_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();