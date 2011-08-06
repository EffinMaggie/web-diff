var patchContext = [];
var patchData = [];
var targetRoots = [];
var nodeWatch = [];
var pseudoLocation = location.href;

var URLLengthSoftLimit = 1000;

function tagPatches()
{
    var a = document.getElementsByTagName('a');
    var i;
    for (i = 0; i < a.length; i++)
    {
        var t = a[i];
        t.onclick =
            function()
//                { setTimeout(function(){ patch(t); }, 0);
                { patch(t);
                  return false };
    }
}

function testNodeCallbacks()
{
    var t, n, c, mc, nW = [];

    while (t = nodeWatch.shift())
    {
        n  = t[0];
        c  = t[1];
        mc = 0;

        for (j = 0; j < n.length; j++)
        {
            var d = patchData[n[j]];
            if (typeof (d) == 'undefined')
            {
                mc++;
            }
        }

        if (mc == 0)
        {
            c();
        }
        else
        {
            nW.unshift(t);
        }
    }

    nodeWatch = nW;
}

function nodeData(id, instructions)
{
    patchData[id] = instructions;
}

function rememberPatchData(id,node,c)
{
    patchData[id] = node;
    c(node);
}

function getNode(node, c)
{
    function trampoline(e)
    {
        c(e.cloneNode(true));
    }

    var d = patchData[node];
    if (typeof (d) == 'undefined')
    {
        runScript ('js/cache/raw/' + node + '.js', false);
        withNodes
            (array(node),
             function(n)
                 { getNode(node, c); });
    }
    else if (typeof (d) == 'function')
    {
        patchData[node]
            (function(e)
                {rememberPatchData(node,e,trampoline);});
/*        patchData[node]
            (c);*/
    }
    else
    {
        trampoline(patchData[node]);
    }
}

function addChildren(node, children, c)
{
    var id = children.shift();
    if (children.length > 0)
    {
        getNode(id,
            function(n)
                {node.appendChild(n);
                 addChildren(node, children, c);});
    }
    else
    {
        getNode(id,
            function(n)
                {node.appendChild(n);
                 c(node);});
    }
}

function makeRoot(node,target)
{
    var d = document.getElementsByTagName('html');
    var r = d[0];
    var p = r.parentNode;

    p.replaceChild(node,r);
//    p.removeChild(r);
    tagPatches();
    window.history.pushState(null,'',target);
}

function insertTargetRoot(target, root)
{
    targetRoots[target] = root;
}

function patch(link)
{
    /* this particular optimisation might be bad, should make this toggleable.
     * maybe i should make it so that shift-clicking will always reload. */
    if( typeof targetRoots[link.href] == 'string' )
    {
        patchTo(link.href, [targetRoots[link.href]]);
    }
    else
    {
        runScript
            ('js/diff.php?t='+escape(link.href), false);
    }

    return false;
}

function withNodes(nodes, c)
{
    nodeWatch.unshift([nodes, c]);
}

function loadNodes(nodes, c)
{
    function requestNodes(st, nodesCount)
    {
        if (nodesCount == 0)
        {
        }
        else if (nodesCount == 1)
        {
            runScript('js/cache/raw/' + st + '.js', false);
        }
        else
        {
//            runScript('js/cache.php?n=' + s, false);
            runScript('js/cache/' + st + '.js', false);
        }
    }

    s  = '';
    sc = 0;
    nq = 0;

    for (i = 0; i < nodes.length; i++)
    {
        var n = nodes[i];
        var d = patchData[n];
        if (typeof (d) == 'undefined')
        {
            if (nq == 0)
            {
                s += n;
            }
            else
            {
                s += '/'+n;
            }

            nq++;
            sc++;

            if (s.length > URLLengthSoftLimit)
            {
                requestNodes(s, nq);
                nq = 0;
                s  = '';
            }
        }
    }

    requestNodes(s, nq);

    if (c != false)
    {
        if (sc == 0)
        {
            c();
        }
        else
        {
            withNodes (nodes, c);
        }
    }
}

function patchTo(target,nodes)
{
    var r = nodes[0];
    insertTargetRoot(target, r);
    loadNodes
        (nodes,
         function()
            { getNode (r, function(e)
                  {makeRoot(e,target);}); });
}

function pushPatchContext(c)
{
    patchContext.unshift(c);
}

function patchResume()
{
    var c = patchContext.shift();
    if (typeof (c) == 'function')
    {
        c();
    }
    testNodeCallbacks();
}

function runScript(script,c)
{
    var e = document.createElement( 'script' );
    e.type = 'text/javascript';
    e.src = script;

    var d = document.getElementsByTagName('body');

    if (c == false)
    {
        pushPatchContext(c);
    }

    e.onload = function(){d[0].removeChild(this);patchResume();}

    d[0].appendChild( e );
}

function goNuts()
{
    tagPatches();
}
