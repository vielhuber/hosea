# 📑 comparehelper 📑

comparehelper is a small php helper for comparing api responses in your tests.

## installation

install once with composer:
```
composer require vielhuber/comparehelper
```

then add this to your files:
```php
require __DIR__.'/vendor/autoload.php';
use vielhuber\comparehelper\comparehelper;
```

## usage

```php
CompareHelper::compare($var1, $var2); // true|false
```

you can use the following placeholders:

- ```*```: any datatype
- ```#STR#```: any string
- ```#INT#```: any numeric value

## examples

```php
CompareHelper::compare('foo','foo'); // true

CompareHelper::compare(42,42); // true

CompareHelper::compare(
    [
        'foo' => 'bar'
    ],
    [
        'foo' => 'bar',
        'foo2' => 'bar'
    ]
); // false

CompareHelper::compare(
    [
        'foo' => 'bar',
        'bar' => [
            'baz',
            42
        ]
    ],
    [
        '#STR' => '*',
        'bar' => [
            '#STR#',
            '#INT#'
        ]
    ]
); // true

// ordering is lazy
CompareHelper::compare(['foo','bar'],['bar','foo']); // true
CompareHelper::compare(['#INT#','#STR#'],[42,'foo']); // true
CompareHelper::compare(['#INT#','#STR#'],['foo',42]); // false
CompareHelper::compare(['foo' => 7,'bar' => 42],['bar' => 42,'foo' => 7,]); // true
CompareHelper::compare(['#INT#' => 7,'#STR#' => 42],[7 => 7,'foo' => 42]); // true
CompareHelper::compare(['#INT#' => 7,'#STR#' => 42],['foo' => 42,7 => 7]); // false

// datatypes are strict
CompareHelper::compare(42,'42'); // false
```