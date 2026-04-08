/**
 * Vercel Edge Middleware — short /admin URL (rewrites in vercel.json are easy to miss on deploy).
 * @see https://vercel.com/docs/functions/edge-middleware
 */
export default function middleware(request) {
  const url = new URL(request.url)
  const path = url.pathname
  if (path === '/admin' || path === '/admin/') {
    url.pathname = '/admin.html'
    return Response.redirect(url.toString(), 307)
  }
}

export const config = {
  matcher: ['/admin', '/admin/'],
}
