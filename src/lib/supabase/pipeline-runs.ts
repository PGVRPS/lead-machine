import { createServerClient } from './server'

export type PipelineRunStatus =
  | 'scraping_buildings'
  | 'scraping_reviews'
  | 'analyzing'
  | 'scoring'
  | 'enriching'
  | 'complete'
  | 'error'

const RUNNING_STATES: PipelineRunStatus[] = [
  'scraping_buildings',
  'scraping_reviews',
  'analyzing',
  'scoring',
  'enriching',
]

export interface PipelineRun {
  id: string
  status: PipelineRunStatus
  progress: string
  error: string | null
  summary: Record<string, number> | null
  params: Record<string, unknown> | null
  started_at: string
  completed_at: string | null
  updated_at: string
}

export async function createPipelineRun(
  params: Record<string, unknown>,
): Promise<{ id: string }> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pipeline_runs')
    .insert({ status: 'scraping_buildings', progress: 'Starting pipeline...', params })
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id }
}

export async function updatePipelineRun(
  id: string,
  fields: {
    status?: PipelineRunStatus
    progress?: string
    error?: string | null
    summary?: Record<string, number> | null
  },
): Promise<void> {
  const supabase = createServerClient()
  const update: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() }
  if (fields.status === 'complete' || fields.status === 'error') {
    update.completed_at = new Date().toISOString()
  }
  const { error } = await supabase.from('pipeline_runs').update(update).eq('id', id)
  if (error) throw error
}

export async function getLatestPipelineRun(): Promise<PipelineRun | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as PipelineRun | null) ?? null
}

export async function getRunningPipelineRun(): Promise<PipelineRun | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .in('status', RUNNING_STATES)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as PipelineRun | null) ?? null
}
