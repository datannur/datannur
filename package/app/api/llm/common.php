<?php
/**
 * Common functions for LLM API endpoints
 */

// Never let warnings/notices leak into JSON or SSE responses (errors still go to the server log)
ini_set('display_errors', '0');

/**
 * Load LLM configuration
 */
function loadConfig(): ?array {
    $configFile = __DIR__ . '/../../../data/llm-web.config.json';
    if (!file_exists($configFile)) {
        return null;
    }
    $config = json_decode(file_get_contents($configFile), true);
    return (json_last_error() === JSON_ERROR_NONE) ? $config : null;
}

/**
 * Send JSON error response and exit
 */
function sendError(int $code, string $message): never {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Verify Cloudflare Turnstile token
 */
function verifyTurnstile(string $secret, string $token): bool {
    $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ]),
        CURLOPT_TIMEOUT => 10
    ]);
    $response = curl_exec($ch);

    if ($response === false) {
        return false;
    }

    $result = json_decode($response, true);
    return $result['success'] ?? false;
}

function isLocalhostRequest(): bool {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $host = preg_replace('/:\d+$/', '', $host);
    $host = trim($host, '[]');
    return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
}

/**
 * Set common security and CORS headers
 */
function setCommonHeaders(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    // CORS: Allow any origin - security is enforced by session token (HMAC signed)
    // and Turnstile verification (domain-bound on Cloudflare side)
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Turnstile-Token, X-Session-Token');
}

/**
 * Handle CORS preflight request
 */
function handlePreflight(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Validate request method
 */
function requirePost(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError(405, 'Method not allowed');
    }
}

/**
 * Verify session token
 * Returns true if valid, false otherwise
 */
function verifySession(string $sessionToken, string $secret): bool {
    $parts = explode('.', $sessionToken);
    if (count($parts) !== 2) {
        return false;
    }

    [$encodedData, $signature] = $parts;
    $sessionJson = base64_decode($encodedData);
    
    if ($sessionJson === false) {
        return false;
    }

    // Verify signature (timing-safe comparison)
    $expectedSignature = hash_hmac('sha256', $sessionJson, $secret);
    if (!hash_equals($expectedSignature, $signature)) {
        return false;
    }

    $sessionData = json_decode($sessionJson, true);
    if (!$sessionData) {
        return false;
    }

    // Check expiration
    if (($sessionData['expires'] ?? 0) < time()) {
        return false;
    }

    // Enforce IP binding
    $currentIp = $_SERVER['REMOTE_ADDR'] ?? '';
    if (($sessionData['ip'] ?? '') !== $currentIp) {
        return false;
    }

    return true;
}

/**
 * Load and validate config, verify session token
 * Returns [apiKey, productId] or exits with error
 */
function initRequest(): array {
    $config = loadConfig();
    if (!$config) {
        sendError(500, 'LLM not configured');
    }

    $apiKey = $config['infomaniak']['apiKey'] ?? null;
    $productId = $config['infomaniak']['productId'] ?? null;

    if (!$apiKey || !$productId || !preg_match('/^[a-zA-Z0-9_-]+$/', $productId)) {
        sendError(500, 'Invalid API configuration');
    }

    if (isLocalhostRequest()) {
        return [$apiKey, $productId];
    }

    // Verify session token
    $sessionToken = $_SERVER['HTTP_X_SESSION_TOKEN'] ?? null;
    if (!$sessionToken) {
        sendError(403, 'Session token required');
    }

    $turnstileSecret = $config['turnstile']['secretKey'] ?? null;
    if (!$turnstileSecret) {
        sendError(500, 'Security not configured');
    }
    
    $secret = $config['session']['secret'] ?? $turnstileSecret;
    if (!verifySession($sessionToken, $secret)) {
        sendError(403, 'Invalid or expired session');
    }

    return [$apiKey, $productId];
}
