<?php
/**
 * LLM Status Endpoint
 * Returns public configuration (Turnstile siteKey) and service status
 * GET /api/llm/status.php
 */

require_once __DIR__ . '/common.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError(405, 'Method not allowed');
}

$config = loadConfig();
if (!$config) {
    sendError(500, 'LLM config not found');
}

$siteKey = $config['turnstile']['siteKey'] ?? null;
$hasInfomaniak = !empty($config['infomaniak']['apiKey']) && !empty($config['infomaniak']['productId']);

echo json_encode([
    'enabled' => $hasInfomaniak && !empty($siteKey),
    'requiresTurnstile' => !isLocalhostRequest(),
    'siteKey' => $siteKey,
]);
