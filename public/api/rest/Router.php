<?php

class Router {
    private $routes = [];
    private $basePath;

    public function __construct($basePath = '') {
        $this->basePath = rtrim($basePath, '/');
    }

    public function get($pattern, $callback) {
        $this->addRoute('GET', $pattern, $callback);
    }

    private function addRoute($method, $pattern, $callback) {
        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'callback' => $callback
        ];
    }

    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        if ($this->basePath && strpos($path, $this->basePath) === 0) {
            $path = substr($path, strlen($this->basePath));
        }
        
        $path = '/' . trim($path, '/');

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->matchRoute($route['pattern'], $path);
            if ($params !== false) {
                $result = call_user_func_array($route['callback'], $params);
                if (is_array($result)) {
                    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Not Found'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function matchRoute($pattern, $path) {
        $pattern = preg_replace('/\/:([^\/]+)/', '/(?P<$1>[^/]+)', $pattern);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $path, $matches)) {
            $params = [];
            foreach ($matches as $key => $value) {
                if (!is_numeric($key)) {
                    $params[] = $value;
                }
            }
            return $params;
        }

        return false;
    }
}
