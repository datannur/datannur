<?php
/**
 * LLM Chat Completions Endpoint
 * Proxy to Infomaniak API with Turnstile verification and streaming support
 * POST /api/llm/index.php
 */

require_once __DIR__ . '/common.php';

// Disable output buffering for streaming
while (ob_get_level()) {
    ob_end_clean();
}

setCommonHeaders();
handlePreflight();
requirePost();

[$apiKey, $productId] = initRequest();

// Get and validate request body
$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($payload)) {
    sendError(400, 'Invalid JSON payload');
}

if (empty($payload['messages']) || !is_array($payload['messages'])) {
    sendError(400, 'Messages array required');
}

// Proxy to Infomaniak (streaming)
proxyToInfomaniak($apiKey, $productId, $input);

// === Endpoint-specific Functions ===

function proxyToInfomaniak(string $apiKey, string $productId, string $body): void {
    $url = "https://api.infomaniak.com/2/ai/{$productId}/openai/v1/chat/completions";

    $ch = curl_init($url);
    
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer {$apiKey}",
            'Accept: text/event-stream'
        ],
        CURLOPT_TIMEOUT => 120,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);

    // Streaming: output chunks as they arrive
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    header('X-Accel-Buffering: no');

    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) {
        echo $chunk;
        flush();
        return strlen($chunk);
    });

    $result = curl_exec($ch);
    
    if ($result === false) {
        echo "data: {\"error\": \"" . curl_error($ch) . "\"}\n\n";
        flush();
    }

    curl_close($ch);
}
