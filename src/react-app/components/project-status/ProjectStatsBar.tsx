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

export default function ProjectStatsBar() {
  return null;
}