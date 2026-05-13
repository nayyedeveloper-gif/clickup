<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class LinkPreviewController extends Controller
{
    /**
     * Fetch OpenGraph metadata for a URL and return it as JSON.
     * Results are cached for 24 hours per URL.
     */
    public function show(Request $request): JsonResponse
    {
        $url = trim((string) $request->query('url', ''));
        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return response()->json(['error' => 'Invalid URL'], 422);
        }

        // Only allow http(s)
        $scheme = parse_url($url, PHP_URL_SCHEME);
        if (! in_array(strtolower((string) $scheme), ['http', 'https'], true)) {
            return response()->json(['error' => 'Unsupported scheme'], 422);
        }

        $cacheKey = 'link_preview:' . md5($url);

        $payload = Cache::remember($cacheKey, now()->addHours(24), function () use ($url) {
            return $this->fetchMetadata($url);
        });

        return response()->json($payload);
    }

    private function fetchMetadata(string $url): array
    {
        try {
            $response = Http::timeout(5)
                ->withUserAgent('Mozilla/5.0 (compatible; 29ManagementBot/1.0; +https://managers.29jewellery.com)')
                ->withOptions(['allow_redirects' => ['max' => 3]])
                ->get($url);
        } catch (\Throwable $e) {
            return ['url' => $url, 'error' => 'fetch_failed'];
        }

        if (! $response->successful()) {
            return ['url' => $url, 'error' => 'http_' . $response->status()];
        }

        $contentType = strtolower((string) $response->header('Content-Type'));
        if ($contentType !== '' && ! str_contains($contentType, 'text/html')) {
            return ['url' => $url, 'error' => 'not_html', 'content_type' => $contentType];
        }

        $html = (string) $response->body();

        // Limit parsing to first 256KB to avoid huge pages
        if (strlen($html) > 256 * 1024) {
            $html = substr($html, 0, 256 * 1024);
        }

        $title = $this->extractMeta($html, 'og:title')
            ?? $this->extractMeta($html, 'twitter:title')
            ?? $this->extractTitle($html);

        $description = $this->extractMeta($html, 'og:description')
            ?? $this->extractMeta($html, 'twitter:description')
            ?? $this->extractDescription($html);

        $image = $this->extractMeta($html, 'og:image')
            ?? $this->extractMeta($html, 'twitter:image');

        $siteName = $this->extractMeta($html, 'og:site_name');

        $host = parse_url($url, PHP_URL_HOST);

        // Resolve relative image URLs
        if ($image && ! preg_match('#^https?://#i', $image)) {
            $image = rtrim(($scheme = parse_url($url, PHP_URL_SCHEME)) . '://' . $host, '/')
                . '/' . ltrim($image, '/');
        }

        return [
            'url' => $url,
            'title' => $title,
            'description' => $description,
            'image' => $image,
            'site_name' => $siteName ?? $host,
            'host' => $host,
        ];
    }

    private function extractMeta(string $html, string $property): ?string
    {
        $patterns = [
            '#<meta[^>]+property=["\']' . preg_quote($property, '#') . '["\'][^>]+content=["\']([^"\']+)["\'][^>]*>#i',
            '#<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' . preg_quote($property, '#') . '["\'][^>]*>#i',
            '#<meta[^>]+name=["\']' . preg_quote($property, '#') . '["\'][^>]+content=["\']([^"\']+)["\'][^>]*>#i',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $m)) {
                return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
        }
        return null;
    }

    private function extractTitle(string $html): ?string
    {
        if (preg_match('#<title[^>]*>([^<]+)</title>#i', $html, $m)) {
            return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        return null;
    }

    private function extractDescription(string $html): ?string
    {
        return $this->extractMeta($html, 'description');
    }
}
