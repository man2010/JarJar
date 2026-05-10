import { useState, useEffect, type ReactNode } from 'react';

type Route = {
  path: string;
  search: string;
  params: Record<string, string>;
};

let navigateFn: (path: string) => void;

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parsePath(typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`));

  useEffect(() => {
    setRoute(parsePath(`${window.location.pathname}${window.location.search}`));
    function handlePopState() {
      setRoute(parsePath(`${window.location.pathname}${window.location.search}`));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setRoute(parsePath(path));
  }

  navigateFn = navigate;

  return { route, navigate };
}

export function navigate(path: string) {
  navigateFn(path);
}

function parsePath(pathname: string): Route {
  const [path, query = ''] = pathname.split('?');
  const search = query ? `?${query}` : '';
  const paths: [RegExp, string[]][] = [
    [/^\/$/, []],
    [/^\/feed$/, []],
    [/^\/post\/([^/]+)$/, ['id']],
    [/^\/edit\/([^/]+)$/, ['id']],
    [/^\/new$/, []],
    [/^\/login$/, []],
    [/^\/register$/, []],
    [/^\/profile\/([^/]+)$/, ['username']],
    [/^\/bookmarks$/, []],
    [/^\/notifications$/, []],
    [/^\/collecte$/, []],
    [/^\/collectes$/, []],
    [/^\/collecte\/([^/]+)$/, ['id']],
    [/^\/admin$/, []],
    [/^\/footer\/([^/]+)$/, ['slug']],
  ];

  for (const [pattern, paramNames] of paths) {
    const match = path.match(pattern);
    if (match) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { path, search, params };
    }
  }

  return { path, search, params: {} };
}

export function Link({ to, children, className, onClick }: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
