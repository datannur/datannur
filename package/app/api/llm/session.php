<?php
/**
 * LLM Session Endpoint
 * Validates Turnstile token and creates a session for subsequent API calls
 * POST /api/llm/session.php
 */

require_once __DIR__ . '/common.php';

setCommonHeaders();
handlePreflight();
requirePost();

$config = loadConfig();
if (!$config) {
    sendError(500, 'LLM not configured');
}

if (isLocalhostRequest()) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'sessionToken' => 'localhost',
        'expiresIn' => 3600
    ]);
    exit;
}

$turnstileSecret = $config['turnstile']['secretKey'] ?? null;
if (!$turnstileSecret) {
    sendError(500, 'Turnstile not configured');
}

// Verify Turnstile token
$turnstileToken = $_SERVER['HTTP_X_TURNSTILE_TOKEN'] ?? null;
if (!$turnstileToken) {
    sendError(403, 'Turnstile token required');
}

if (!verifyTurnstile($turnstileSecret, $turnstileToken)) {
    sendError(403, 'Invalid Turnstile token');
}

// Create session token (valid for 1 hour)
$sessionData = [
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'created' => time(),
    'expires' => time() + 3600 // 1 hour
];

// Sign the session with a dedicated secret (falls back to Turnstile secret)
$secret = $config['session']['secret'] ?? $turnstileSecret;
$sessionJson = json_encode($sessionData);
$signature = hash_hmac('sha256', $sessionJson, $secret);
$sessionToken = base64_encode($sessionJson) . '.' . $signature;

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'sessionToken' => $sessionToken,
    'expiresIn' => 3600
]);
