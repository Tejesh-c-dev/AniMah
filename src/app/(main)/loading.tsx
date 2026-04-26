export default function MainLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-10 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-5 w-full max-w-2xl rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="h-56 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-4" />
            <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
