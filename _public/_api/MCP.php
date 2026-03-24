<?php

namespace HoseaApi;

use vielhuber\simplemcp\Attributes\McpTool;
use vielhuber\simplemcp\Attributes\Schema;

class MCP
{
    /**
     * Returns the sum of two numbers.
     *
     * @return int
     */
    #[McpTool(name: 'add', description: 'Returns the sum of two numbers.')]
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }

    /**
     * Greets a person by name.
     *
     * @return string
     */
    #[McpTool]
    public function greet(#[Schema(type: 'string', description: 'The name to greet.')] string $name): string
    {
        return "Hello, {$name}!";
    }
}
