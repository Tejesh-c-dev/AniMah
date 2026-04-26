export default function TitleDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div className="md:col-span-1 h-96 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="md:col-span-3 space-y-4">
          <div className="h-10 w-2/3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="h-5 w-44 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
            <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
