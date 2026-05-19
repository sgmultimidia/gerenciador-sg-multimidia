interface ProjectStatsByStatus {
  not_started: number;
  in_progress: number;
  review: number;
  completed: number;
  cancelled: number;
}

interface ProjectStatsBarProps {
  stats: ProjectStatsByStatus;
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export default function ProjectStatsBar({ stats, filterStatus, onFilterChange }: ProjectStatsBarProps) {
  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'not_started', label: 'Não iniciado', count: stats.not_started },
    { key: 'in_progress', label: 'Em andamento', count: stats.in_progress },
    { key: 'review', label: 'Revisão', count: stats.review },
    { key: 'completed', label: 'Concluído', count: stats.completed },
    { key: 'cancelled', label: 'Cancelado', count: stats.cancelled },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          style={{
            padding: '4px 12px',
            borderRadius: '999px',
            border: '1px solid #ccc',
            background: filterStatus === f.key ? '#1a1a2e' : 'white',
            color: filterStatus === f.key ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
        </button>
      ))}
    </div>
  );
}
