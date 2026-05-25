<?php
/**
 * LLM Audio Transcription Endpoint (Speech-to-Text)
 * Proxy to Infomaniak Whisper API with Turnstile verification
 * POST /api/llm/transcribe.php
 */

require_once __DIR__ . '/common.php';

// Constants
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a'];

setCommonHeaders();
handlePreflight();
requirePost();

[$apiKey, $productId] = initRequest();

// Validate content type
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'multipart/form-data') === false) {
    sendError(400, 'multipart/form-data required');
}

// Check for uploaded file
if (empty($_FILES['file'])) {
    sendError(400, 'No audio file provided');
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    sendError(400, 'File upload error');
}

// Validate file size
if ($file['size'] > MAX_FILE_SIZE) {
    sendError(400, 'File too large (max 25MB)');
}

// Validate file type - be flexible with webm/audio types
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

// Accept any audio/* type, video/webm (webm audio is often detected as video), 
// application/octet-stream (fallback), or explicit allowed types
$isValidType = in_array($mimeType, ALLOWED_AUDIO_TYPES) 
    || strpos($mimeType, 'audio/') === 0
    || $mimeType === 'video/webm'  // WebM audio often detected as video
    || $mimeType === 'application/octet-stream';  // Fallback for unknown

if (!$isValidType) {
    sendError(400, "Invalid audio file type: {$mimeType}");
}

// Get optional parameters (sanitized)
$model = preg_match('/^[a-zA-Z0-9_-]+$/', $_POST['model'] ?? '') ? $_POST['model'] : 'whisper';
$language = preg_match('/^[a-z]{2}$/', $_POST['language'] ?? '') ? $_POST['language'] : 'fr';

// Upload to Infomaniak and poll for result
$result = transcribeAudio($apiKey, $productId, $file, $model, $language);

header('Content-Type: application/json');
echo json_encode($result);

// === Endpoint-specific Functions ===

function transcribeAudio(string $apiKey, string $productId, array $file, string $model, string $language): array {
    $uploadUrl = "https://api.infomaniak.com/1/ai/{$productId}/openai/audio/transcriptions";
    
    $postFields = [
        'file' => new CURLFile($file['tmp_name'], 'audio/webm', 'audio.webm'),
        'model' => $model,
        'language' => $language,
        'response_format' => 'text'
    ];

    $ch = curl_init($uploadUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$apiKey}"],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode >= 400) {
        return ['error' => 'Failed to upload audio'];
    }

    $uploadResult = json_decode($response, true);
    $batchId = $uploadResult['batch_id'] ?? null;

    if (!$batchId || !preg_match('/^[a-zA-Z0-9_-]+$/', $batchId)) {
        return ['error' => 'Invalid response from API'];
    }

    return pollForResult($apiKey, $productId, $batchId);
}

function pollForResult(string $apiKey, string $productId, string $batchId): array {
    $maxAttempts = 30;
    $pollInterval = 500000; // 0.5 seconds

    for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
        usleep($pollInterval);

        $resultUrl = "https://api.infomaniak.com/1/ai/{$productId}/results/{$batchId}";
        
        $ch = curl_init($resultUrl);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => ["Authorization: Bearer {$apiKey}"],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        if ($response === false) {
            continue;
        }

        $result = json_decode($response, true);
        $status = $result['status'] ?? null;

        if (in_array($status, ['done', 'success'])) {
            return ['text' => $result['data'] ?? ''];
        }

        if ($status === 'error') {
            return ['error' => 'Transcription failed'];
        }
    }

    return ['error' => 'Transcription timeout'];
}
