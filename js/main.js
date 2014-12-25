$(function() {
    var query = getQuery();
    if (query['poa-mn'].length)
        $('input[name="poa-mn"]').val(query['poa-mn']);
    if (query['user-name'].length)
        $('input[name="user-name"]').val(query['user-name']);
    if (query['user-password'].length)
        $('input[name="user-password"]').val(query['user-password']);
    if ('use-https' in query)
        $('input[name="use-https"]').prop('checked', true);
    $.ajax({
            type: 'POST',
            url: 'getter.php',
            data: query,
            dataType: 'json'
        })
        .done(function(r) {
            drawGraph(r);
        })
        .fail(function(r) {
            var json = r.responseJSON;
            alert(json.message + ': ' + json.code);
        });

    function getQuery(href) {
        var param = typeof href === 'string';
        do {
            var tmp = (param ? href : decodeURI(window.location.search)),
                tmp1,
                result = {};
            if (!tmp.length)
                break;
            tmp = tmp.split('?');
            if (tmp.length === 1)
                break;
            tmp = tmp[tmp.length - 1];
            if (!tmp.length)
                break;
            tmp.split('&').forEach(function(v) {
                tmp = v.indexOf('=');
                if (tmp === 0)
                    return;
                if (tmp === -1)
                    result[v] = '';
                else
                    result[v.slice(0, tmp)] = decodeURIComponent(v.slice(tmp + 1));
            });
        } while (false);
        return result;
    };

    function drawGraph(types) {
        var idName = {},
            nodes = {},
            links = [];
        types.forEach(function(v) {
            idName[v.id] = v.name;
            if (v.implements) {
                v.implements.forEach(function(v1) {
                    links.push({
                        source: v1,
                        target: v.id
                    });
                })
            }
        });

        // Compute the distinct nodes from the links.
        links.forEach(function(link) {
            link.source = nodes[link.source] ||
                (nodes[link.source] = {
                    name: link.source
                });
            link.target = nodes[link.target] ||
                (nodes[link.target] = {
                    name: link.target
                });
            link.value = +link.value;
        });

        for (var k in nodes) {
            nodes[k].name = idName[k];
            nodes[k].id = k;
        }

        var width = 960,
            height = 1024;

        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(60)
            .charge(-300)
            .on("tick", tick)
            .start();

        var svg = d3.select("#display").append("svg")
            .attr("width", '100%')
            .attr("height", height);

        // build the arrow.
        svg.append("svg:defs").selectAll("marker")
            .data(["end"]) // Different link/path types can be defined here
            .enter().append("svg:marker") // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // add the links and the arrows
        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
            .enter().append("svg:path")
            //    .attr("class", function(d) { return "link " + d.type; })
            .attr("class", "link")
            .attr("marker-end", "url(#end)");

        // define the nodes
        var node = svg.selectAll(".node")
            .data(force.nodes())
            .enter().append("g")
            .attr("class", "node")
            .call(force.drag)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        // add the nodes
        node.append("circle")
            .attr("r", 5);

        // add the text 
        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .attr('data-id', function(d) {
                return d.id;
            })
            .text(function(d) {
                return d.name;
            });

        // add the curvy lines
        function tick() {
            path.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" +
                    d.source.x + "," +
                    d.source.y + "A" +
                    dr + "," + dr + " 0 0,1 " +
                    d.target.x + "," +
                    d.target.y;
            });

            node
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }

        function mouseover() {
            d3.select(this).select("text").text(d3.select(this).select("text").attr('data-id'));
        }

        function mouseout() {
            d3.select(this).select("text").text(idName[d3.select(this).select("text").attr('data-id')]);
        }

    }
});