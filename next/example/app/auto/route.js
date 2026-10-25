// This package has no auto inject (Next.js renders the tag with <PrivatusAnalyticsTag />),
// so /auto answers 404 and the suite skips that test.
export function GET() {
  return new Response('This package has no auto inject.', { status: 404, headers: { 'content-type': 'text/plain' } })
}
