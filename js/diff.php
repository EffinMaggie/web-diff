<?php

$base  = 'http://becquerel.org/~mdeininger/funky/';
$redir = '../';

header('Content-Type: text/javascript');

$to = urldecode($_REQUEST['t']);

$to = str_replace('../', '', $to);

$to = $redir.str_replace($base, '', $to);

/* TODO: add safeguards and get a php with curl to load pages directly */

$t = file_get_contents($to);

$to = DOMDocument::loadXML($t);

function jsEscape($s)
{
    return str_replace(array('\\',"\r","\n",'\''),
                       array('\\\\','\\r','\\n','\\\''),
                       $s);
}

function construct (DOMNode $to, $fl, $sl)
{
    if ($to instanceof DOMText)
    {
        $r = 'document.createTextNode(\''.
                jsEscape($to->wholeText).
             '\')';

        return $r;
    }
    else
    {
        $r = 'var e=document.createElement(\''.$to->nodeName.'\');';
        $tn = $to->attributes;
        for ($j = 0; $j < $tn->length; $j++)
        {
            $tnn = $tn->item($j);
            $r.= 'e[\''.$tnn->nodeName.'\']=\''.jsEscape($tnn->nodeValue).'\';';
        }
/*        if ($to->nodeValue !== '')
        {
            $r .= 'e.textContent=\''.jsEscape($to->nodeValue).'\';';
        }*/
        if (count($sl) > 0)
        {
            $r.='addChildren(e,[\''.implode('\',\'',$sl).'\'],c);';
        }
        else
        {
            $r.='c(e);';
        }
    }

    return 'function(c){'.$r.'}';
}

function recurse (DOMNode $to, $tl)
{
    $r  = array();
    $ni = array();
    $sl = array();
    $tn = $to->childNodes;
    for ($j = 0; $j < $tn->length; $j++)
    {
        $tnn = $tn->item($j);
        list($q,$n) = recurse($tnn, $tl.'.childNodes['.$j.']');
        $r = array_merge($r,$q);
        $sl[] = $q[0];
        $ni=array_merge($n,$ni);
        $tr = $tnn->ownerDocument->saveXML($tnn);
    }

    $sn = md5($tx = $to->ownerDocument->saveXML($to));
    $ni[$sn] = construct ($to, $fl, $sl);

    $r = array_merge(array($sn),$r);

    return array($r,$ni);
}

function prune (DOMNode $to)
{
    $tn = $to->childNodes;
    for ($j = 0; $j < $tn->length; $j++)
    {
        $tnn = $tn->item($j);
        if (($tnn->nodeName == 'script') &&
            ($tnn->attributes->getNamedItem('src')->nodeValue
                == 'js/bonkers.js'))
        {
            $to->removeChild($tnn);
            $j = -1;
        }
        else
        {
            prune ($tnn);
        }
    }
}

prune($to->getElementsByTagName('html')->item(0));

list($patch, $nodes) = recurse
    ($to->getElementsByTagName('html')->item(0),
     'document.getElementsByTagName(\'html\')[0]',
     '');

if (!is_dir('cache/raw'))
{
    if (!is_dir('cache'))
    {
        mkdir ('cache');
    }

    mkdir ('cache/raw');
}

foreach ($nodes as $sn => $in)
{
    if (!file_exists ('cache/raw/'.$sn.'.js'))
    {
        file_put_contents('cache/raw/'.$sn.'.js', 'nodeData(\''.$sn.'\','.$in.');');
    }
}
echo 'patchTo(\''.jsEscape($_REQUEST['t']).'\',[\''.implode('\',\'',array_unique($patch)).'\']);';
