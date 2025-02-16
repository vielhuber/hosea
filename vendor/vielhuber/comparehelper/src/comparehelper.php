<?php
namespace vielhuber\comparehelper;

class comparehelper
{

    public static function compare($d1, $d2)
    {

        if( ($d1 === '#STR#' && is_string($d2)) || ($d2 === '#STR#' && is_string($d1)) )
        {
            return true;
        }
        if( ($d1 === '#INT#' && is_numeric($d2)) || ($d2 === '#INT#' && is_numeric($d1)) )
        {
            return true;
        }
        if( $d1 === '*' || $d2 === '*' )
        {
            return true;
        }
        if( gettype($d1) !== gettype($d2) )
        {
            return false;
        }
        if( is_string($d1) )
        {
            if( $d1 !== $d2 )
            {
                return false;
            }
        }
        if( is_numeric($d1) )
        {
            if( $d1 !== $d2 )
            {
                return false;
            }
        }
        if( is_array($d1) || is_object($d1) )
        {
            if( is_object($d1) )
            {
                /* warning: (array) kills datatypes of objects when type casting with (array) in php < 7.2 */
                //$d1 = (array)$d1;
                //$d2 = (array)$d2;
                /* we cast this via json_encode instead */
                $d1 = json_decode(json_encode($d1),true);
                $d2 = json_decode(json_encode($d2),true);
            }

            if( count($d1) !== count($d2) )
            {
                return false;
            }

            // sorting by key is problematic for placeholders: fix this
            foreach([1,2] as $num)
            {
                $index = 0;
                foreach(${'d'.$num} as ${'d'.$num.'__key'}=>${'d'.$num.'__value'})
                {
                    if( ${'d'.$num.'__key'} === '#STR#' )
                    {
                        if( !is_string(array_keys(${'d'.($num%2+1)})[$index]) )
                        {
                            return false;
                        }
                        ${'d'.$num}[array_keys(${'d'.($num%2+1)})[$index]] = ${'d'.$num.'__value'}; unset(${'d'.$num}[${'d'.$num.'__key'}]);
                    }
                    if( ${'d'.$num.'__key'} === '#INT#' )
                    {
                        if( !is_numeric(array_keys(${'d'.($num%2+1)})[$index]) )
                        {
                            return false;
                        }
                        ${'d'.$num}[array_keys(${'d'.($num%2+1)})[$index]] = ${'d'.$num.'__value'}; unset(${'d'.$num}[${'d'.$num.'__key'}]);
                    }
                    if( ${'d'.$num.'__key'} === '*' )
                    {
                        ${'d'.$num}[array_keys(${'d'.($num%2+1)})[$index]] = ${'d'.$num.'__value'}; unset(${'d'.$num}[${'d'.$num.'__key'}]);
                    }
                    $index++;
                }
            }
            
            foreach([1,2] as $num)
            {
                $index = 0;
                foreach(${'d'.$num} as ${'d'.$num.'__key'}=>${'d'.$num.'__value'})
                {
                    if( ${'d'.$num.'__value'} === '#STR#' )
                    {
                        if( !is_string(${'d'.($num%2+1)}[${'d'.$num.'__key'}]) )
                        {
                            return false;
                        }
                        ${'d'.$num}[${'d'.$num.'__key'}] = ${'d'.($num%2+1)}[${'d'.$num.'__key'}];
                    }
                    if( ${'d'.$num.'__value'} === '#INT#' )
                    {
                        if( !is_numeric(${'d'.($num%2+1)}[${'d'.$num.'__key'}]) )
                        {                            
                            return false;
                        }
                        ${'d'.$num}[${'d'.$num.'__key'}] = ${'d'.($num%2+1)}[${'d'.$num.'__key'}];
                    }
                    if( ${'d'.$num.'__value'} === '*' )
                    {
                        ${'d'.$num}[${'d'.$num.'__key'}] = ${'d'.($num%2+1)}[${'d'.$num.'__key'}];
                    }
                    $index++;
                }
            }

            // sort by key
            ksort($d1);
            ksort($d2);

            // sort by value (if keys are from 0 to n)
            $sort = true;            
            for($i = 0; $i < count($d1); $i++) { if( array_keys($d1)[$i] !== $i ) { $sort = false; } }
            if( $sort === true ) { sort($d1); }
            for($i = 0; $i < count($d2); $i++) { if( array_keys($d2)[$i] !== $i ) { $sort = false; } }
            if( $sort === true ) { sort($d2); }

            foreach($d1 as $data__key=>$data__value)
            {
                if( !array_key_exists($data__key, $d2) )
                {
                    return false;
                }
                if( self::compare($d1[$data__key], $d2[$data__key]) === false )
                {
                    return false;
                }
            }

        }
        return true;
    }

}