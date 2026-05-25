<?php

class JsonDatabase {
    private $dataPath;
    private $cache = [];

    public function __construct($dataPath) {
        $this->dataPath = rtrim($dataPath, '/');
    }

    public function getTables() {
        $files = glob($this->dataPath . '/*.json');
        $tables = [];
        
        foreach ($files as $file) {
            $basename = basename($file, '.json');
            if (!in_array($basename, ['__meta__', '__table__'])) {
                $tables[] = $basename;
            }
        }
        
        return $tables;
    }

    public function getAll($table) {
        $data = $this->loadTable($table);
        return array_values($data ?? []);
    }

    public function getById($table, $id) {
        $data = $this->loadTable($table);
        
        foreach ($data as $item) {
            if (isset($item['id']) && $item['id'] == $id) {
                return $item;
            }
        }
        
        return null;
    }

    public function filter($table, $filters) {
        $data = $this->getAll($table);
        
        foreach ($filters as $key => $value) {
            if (strpos($key, '_') === 0) {
                continue;
            }
            
            $data = array_filter($data, function($item) use ($key, $value) {
                return isset($item[$key]) && $item[$key] == $value;
            });
        }
        
        return array_values($data);
    }

    public function paginate($data, $limit, $offset = 0) {
        return array_slice($data, $offset, $limit);
    }

    public function sort($data, $field, $order = 'asc') {
        usort($data, function($a, $b) use ($field, $order) {
            $valA = $a[$field] ?? null;
            $valB = $b[$field] ?? null;
            
            $result = $valA <=> $valB;
            return $order === 'desc' ? -$result : $result;
        });
        
        return $data;
    }

    private function loadTable($table) {
        if (isset($this->cache[$table])) {
            return $this->cache[$table];
        }

        $file = $this->dataPath . '/' . $table . '.json';
        
        if (!file_exists($file)) {
            return null;
        }

        $content = file_get_contents($file);
        $data = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in table: $table");
        }

        $this->cache[$table] = $data;
        return $data;
    }
}
