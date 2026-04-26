import Link from 'next/link';
import Image from 'next/image';
import { Card, Button } from '@/components/ui';
import { TitleType } from '@/types';

export const revalidate = 60;

type SearchParams = {
  type?: string;
  search?: string;
  page?: string;
};

interface Title {
  id: string;
  name: string;
  description: string;
  releaseYear: number;
  type: TitleType;
  coverImage?: string;
  genres: string[];
}

interface PaginatedResponse {
  data: Title[];
  pagination: {
    page: number;
    total: number;
    pages: number;
  };
}

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing API base URL. Set NEXT_PUBLIC_API_URL (or API_URL for server components).');
  }

  return 'http://localhost:5000';
};

const allowedTypes = new Set(['ALL', 'ANIME', 'MANHWA', 'MOVIE']);

const toQuery = (params: SearchParams) => {
  const qs = new URLSearchParams();

  if (params.type) {
    qs.set('type', params.type);
  }

  if (params.search) {
    qs.set('search', params.search);
  }

  if (params.page) {
    qs.set('page', params.page);
  }

  qs.set('limit', '12');
  return qs.toString();
};

async function getTitles(params: SearchParams): Promise<PaginatedResponse> {
  const apiUrl = getApiUrl();
  const query = toQuery(params);
  const response = await fetch(`${apiUrl}/api/titles?${query}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch titles');
  }

  return response.json();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const selectedType =
    typeof searchParams.type === 'string' && allowedTypes.has(searchParams.type)
      ? searchParams.type
      : 'ALL';

  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : '';
  const currentPageRaw = Number(searchParams.page || '1');
  const currentPage = Number.isFinite(currentPageRaw) && currentPageRaw > 0 ? currentPageRaw : 1;

  const data = await getTitles({
    type: selectedType,
    search: searchQuery,
    page: String(currentPage),
  });

  const totalPages = Math.max(1, data.pagination.pages || 1);

  const createHref = (nextType: string, nextSearch: string, nextPage: number) => {
    const params = new URLSearchParams();
    params.set('type', nextType);

    if (nextSearch.trim()) {
      params.set('search', nextSearch.trim());
    }

    params.set('page', String(Math.max(1, nextPage)));
    return `/?${params.toString()}`;
  };

  const types = [
    { value: 'ALL', label: 'All' },
    { value: 'ANIME', label: 'Anime' },
    { value: 'MANHWA', label: 'Manhwa' },
    { value: 'MOVIE', label: 'Movies' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Discover Titles
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Explore anime, manhwa, and movies. Track what you watch, rate and review titles, and discover new favorites.
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <form action="/" method="get" className="relative">
          <input type="hidden" name="type" value={selectedType} />
          <input type="hidden" name="page" value="1" />
          <input
            type="text"
            name="search"
            placeholder="Search titles by name..."
            defaultValue={searchQuery}
            className="input w-full pl-10"
          />
          <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        <div className="flex flex-wrap gap-3">
          {types.map((type) => (
            <Link
              key={type.value}
              href={createHref(type.value, searchQuery, 1)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedType === type.value
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {type.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {data.data.length > 0 ? (
          data.data.map((title) => (
            <Link key={title.id} href={`/titles/${title.id}`}>
              <Card hoverable clickable className="h-full flex flex-col">
                {title.coverImage ? (
                  <Image
                    src={title.coverImage}
                    alt={title.name}
                    width={320}
                    height={256}
                    unoptimized
                    className="w-full h-64 object-cover rounded mb-4"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded mb-4 flex items-center justify-center">
                    <span className="text-4xl">📺</span>
                  </div>
                )}

                <h3 className="text-lg font-bold mb-2 line-clamp-2">{title.name}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded">
                    {title.type}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{title.releaseYear}</span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-grow mb-3">
                  {title.description}
                </p>

                {title.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {title.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-border rounded text-gray-700 dark:text-gray-300"
                      >
                        {genre}
                      </span>
                    ))}
                    {title.genres.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">+{title.genres.length - 3}</span>
                    )}
                  </div>
                )}

                <Button variant="primary" size="sm" fullWidth>
                  View Details
                </Button>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No titles found. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-12">
          <Link href={createHref(selectedType, searchQuery, currentPage - 1)} aria-disabled={currentPage === 1}>
            <Button variant="secondary" disabled={currentPage === 1}>
              Previous
            </Button>
          </Link>

          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
            if (pageNum > totalPages) {
              return null;
            }

            return (
              <Link
                key={pageNum}
                href={createHref(selectedType, searchQuery, pageNum)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}

          <Link href={createHref(selectedType, searchQuery, currentPage + 1)} aria-disabled={currentPage === totalPages}>
            <Button variant="secondary" disabled={currentPage === totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
