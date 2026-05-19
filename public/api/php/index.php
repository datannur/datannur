<?php

// Load classes
require_once __DIR__ . '/Router.php';
require_once __DIR__ . '/JsonDatabase.php';

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', '0');

// JSON response header
header('Content-Type: application/json; charset=utf-8');

// Handle OPTIONS requests (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Error handlers
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
});

// Initialize router and database
$publicDir = __DIR__ . '/../..';
$dataPath = realpath($publicDir . '/data/db');

// Detect base path from SCRIPT_NAME (/api/php/index.php -> /api)
$scriptPath = dirname($_SERVER['SCRIPT_NAME']);
$basePath = dirname($scriptPath);

$router = new Router($basePath);
$db = new JsonDatabase($dataPath);

// Read the list of tables from __table__.json
$tablesFile = $dataPath . '/__table__.json';
$tablesData = json_decode(file_get_contents($tablesFile), true);
$tables = array_column($tablesData, 'name');

foreach ($tables as $table) {
    $router->get("/$table", function() use ($db, $table) {
        $data = $db->getAll($table);
        
        if (!empty($_GET)) {
            $limit = isset($_GET['_limit']) ? (int)$_GET['_limit'] : null;
            $offset = isset($_GET['_offset']) ? (int)$_GET['_offset'] : 0;
            $sort = $_GET['_sort'] ?? null;
            $order = $_GET['_order'] ?? 'asc';
            
            $filters = array_filter($_GET, function($key) {
                return strpos($key, '_') !== 0;
            }, ARRAY_FILTER_USE_KEY);
            
            if (!empty($filters)) {
                $data = $db->filter($table, $filters);
            }
            
            if ($sort) {
                $data = $db->sort($data, $sort, $order);
            }
            
            if ($limit) {
                $data = $db->paginate($data, $limit, $offset);
            }
        }
        
        return $data;
    });
    
    $router->get("/$table/:id", function($id) use ($db, $table) {
        $item = $db->getById($table, $id);
        
        if (!$item) {
            http_response_code(404);
            return ['error' => 'Not Found'];
        }
        
        return $item;
    });
}

$router->get('/', function() use ($tables) {
    return [
        'message' => 'Datannur PHP API',
        'version' => '1.0.0',
        'endpoints' => array_map(function($table) {
            return [
                'table' => $table,
                'endpoints' => [
                    "GET /api/$table",
                    "GET /api/$table/{id}"
                ]
            ];
        }, $tables)
    ];
});

$router->dispatch();
