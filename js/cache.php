<?php

header('Content-Type: text/javascript');

if (preg_match('|[a-zA-Z0-9/]+|',$_REQUEST['n']))
{
    $t = explode ('/', $_REQUEST['n']);
    $p = '';
    $r = '';
    foreach ($t as $n)
    {
        if ($p == '')
        {
            $p = $n;
        }
        else
        {
            $p .= '/'.$n;
        }

        if (($p != $_REQUEST['n']) && !(is_dir('cache/'.$p)))
        {
            mkdir('cache/'.$p);
        }

        $r .= file_get_contents('cache/raw/'.$n.'.js');
    }

    echo $r;

    if (!file_exists ('cache/'.$_REQUEST['n'].'.js'))
    {
        file_put_contents ('cache/'.$_REQUEST['n'].'.js', $r);
    }
}
