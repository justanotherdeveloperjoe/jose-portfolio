<?php
// Relays MET Norway's forecast for Monterrey to the Playground, so visitors' browsers only ever talk to this site.
// MET Norway's terms: identify the site, wait until Expires, ask with If-Modified-Since, and credit MET Norway.
// https://api.met.no/doc/TermsOfService · Data licensed CC BY 4.0 by MET Norway.
// Update AGENT when the site moves to its own domain. scripts/weather-dev.mjs is the same relay for local development.
declare(strict_types=1);

const SOURCE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=25.6866&lon=-100.3161';
const AGENT = 'jose-portfolio/1.0 (+https://darkslateblue-eagle-516041.hostingersite.com)';

function fetch_forecast(?string $lastModified): ?array
{
    $headers = [];
    $request = curl_init(SOURCE);
    curl_setopt_array($request, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_USERAGENT => AGENT,
        CURLOPT_ENCODING => '',
        CURLOPT_HTTPHEADER => $lastModified ? ['Accept: application/json', 'If-Modified-Since: ' . $lastModified] : ['Accept: application/json'],
        CURLOPT_HEADERFUNCTION => function ($request, string $line) use (&$headers): int {
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) {
                $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
            }
            return strlen($line);
        },
    ]);
    $body = curl_exec($request);
    $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    // Never ask more often than every ten minutes, whatever Expires says.
    $expires = max(time() + 600, isset($headers['expires']) ? (int) strtotime($headers['expires']) : time() + 1800);
    if ($status === 304) {
        return ['status' => 304, 'expires' => $expires];
    }
    if ($status !== 200 || !is_string($body) || json_decode($body) === null) {
        return null;
    }
    return ['status' => 200, 'expires' => $expires, 'lastModified' => $headers['last-modified'] ?? null, 'body' => $body];
}

$file = sys_get_temp_dir() . '/jose-portfolio-forecast.json';
$cached = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
$cached = is_array($cached) ? $cached : null;

if ($cached === null || time() >= (int) ($cached['expires'] ?? 0)) {
    $lock = fopen($file . '.lock', 'c');
    if ($lock !== false && flock($lock, LOCK_EX | LOCK_NB)) {
        $fresh = fetch_forecast($cached['lastModified'] ?? null);
        if ($fresh === null) {
            // MET Norway is unreachable: keep what we have and try again in five minutes.
            $cached = array_merge($cached ?? [], ['expires' => time() + 300]);
        } elseif ($fresh['status'] === 304 && isset($cached['body'])) {
            $cached['expires'] = $fresh['expires'];
        } elseif ($fresh['status'] === 200) {
            $cached = $fresh;
        }
        file_put_contents($file, json_encode($cached), LOCK_EX);
        flock($lock, LOCK_UN);
    }
    if ($lock !== false) {
        fclose($lock);
    }
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
if (empty($cached['body'])) {
    http_response_code(503);
    header('Cache-Control: no-store');
    echo '{"error":"Weather is unavailable right now."}';
    exit;
}
header('Cache-Control: public, max-age=600');
echo $cached['body'];
