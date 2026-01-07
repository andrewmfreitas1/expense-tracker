// Mock do Next.js navigation para testes
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
};

export const useRouter = jest.fn(() => mockRouter);
export const usePathname = jest.fn(() => '/');
export const useSearchParams = jest.fn(() => new URLSearchParams());
export const useParams = jest.fn(() => ({}));

export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
};
