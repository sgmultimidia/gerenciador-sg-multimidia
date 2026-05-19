interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export default function LoadingSkeleton({ className = '', count = 1, height = 'h-4' }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-slate-700/50 rounded-lg animate-pulse ${className}`}
        ></div>
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="space-y-4">
        <div className="h-6 bg-slate-700/50 rounded-lg w-1/3 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-700/50 rounded-lg w-full animate-pulse"></div>
          <div className="h-4 bg-slate-700/50 rounded-lg w-5/6 animate-pulse"></div>
        </div>
        <div className="h-10 bg-slate-700/50 rounded-lg w-1/2 animate-pulse"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );
}
