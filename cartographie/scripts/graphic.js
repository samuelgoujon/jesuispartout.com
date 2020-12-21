function renderChart() {
	// Exposed variables
	var attrs = {
		id: 'ID' + Math.floor(Math.random() * 1000000), // Id for event handlings
		svgWidth: 400,
		svgHeight: 400,
		marginTop: 5,
		marginBottom: 5,
		marginRight: 5,
		marginLeft: 5,
    container: 'body',
    radius_org: 16,
    radius_people: 10,
    iconSize: 20,
    nodesFontSize: 12,
    defaultFont: 'Helvetica',
    color_org: '#FFAC1E',
    colors:  [
      "#B0E2A7","#19494D",
      "#D0BAE8","#53B8C6",
      "#B83D54","#7A4B29",
      "#286C77","#0E112A",
      "#866ECF","#80CB62",
      "#3B8BB0","#DBDB94",
      "#D6BA85","#B3CC66",
      "#E4B6E7","#79D2AD",
      "#BD6ACD","#DEB99C",
      "#B4E6B3","#2D5986",
      "#79ACD2","#B147C2",
      "#B8853D","#799130",
      "#2D3986"
    ],
    data: null,
    mode: 'first', // first -> clustered view, second -> force view
    openNav: d => d,
    closeNav: d => d
  };

  // constants
  var toggle = null;
  var currentScale = 1;
  var strokeWidth = 1;
  var strokeWidthSelected = 2;
  var padding = 1.5 + strokeWidth; // separation between same-color nodes
  var clusterPadding = 20; // separation between different-color nodes
  var resize_ratio = 1.8; // multiply node radius on select
  var textNodePadding = 17;
  var linkColor = '#666';
  var nodeStroke = '#666';
  var textColorPeople = '#666';
  var textColorSelected = '#000';
  var textColorOrg = '#000';
  var linkColorSelected = '#000';
  var nodeColorSelected = '#fff';
  var nodeStrokeSelected = '#000';
  var hideTextsOnScaleView1 = 2;
  var hideTextsOnScaleView2 = 0.8;

	//Main chart object
	var main = function() {
		//Drawing containers
		var container = d3.select(attrs.container);

		//Calculated properties
		var calc = {};
		calc.id = 'ID' + Math.floor(Math.random() * 1000000); // id for event handlings
		calc.chartLeftMargin = attrs.marginLeft;
		calc.chartTopMargin = attrs.marginTop;
		calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
		calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

    var clusterNames = attrs.data.nodes
      /*.filter(x => x.group.length)
      .map(x => x.group.trim())*/
      .filter((d, i, arr) => arr.indexOf(d) === i);

    var maxRadius = attrs.radius_org,
        m = clusterNames.length,
        color = d3.scale.ordinal().range(attrs.colors).domain(d3.range(m)),
        clusters = new Array(m), // The largest node for each cluster.
        nodes_first, links_first = [],
        nodes_second, links_second, selectedNode;

    let zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", zoomed)

    attrs.data.nodes.forEach(d => {
      var portraits = 'img/portraits/' + d.node + '.jpg';
      var portrait = nodes.filter(x => x.name == d.portrait)[0];
      d.tag = portrait ? 'image' : 'circle';
      d.isImage = portrait ? true : false;
      d.imagePath = portrait ? 'img/portraits/' + portrait.filename : null;
      d.radius = d.type === 'organization' ? attrs.radius_org : attrs.radius_people;
    });

    attrs.data.nodes.forEach(d => {
      var religion = religions.filter(x => x.name == d.religion)[0];
      d.tag = religion ? 'image' : 'circle';
      d.isImage = religion ? true : false;
      d.imagePath = religion ? 'img/' + religion.filename : null;
      d.radius = d.type === 'organization' ? attrs.radius_org : attrs.radius_people;
    });

    // get nodes for first view. ONLY PEOPLE
    nodes_first = attrs.data.nodes
      .filter(d => d.type == 'people')
      .map(function(x) {
        var i = clusterNames.indexOf(x.group);
        var d = Object.assign(x, {
          cluster: i,
          radius: attrs.radius_people,
        });

        if (!clusters[i] || (d.radius > clusters[i].radius)) {
          clusters[i] = d;
        }
        return d;
      })
    
    // get nodes for the second view. NODES that are connected to something
    nodes_second = attrs.data.nodes.filter(x => {
      return (attrs.data.links.some(d => d.source === x.node || d.target === x.node));
    });

    // get links for the second view
    links_second = attrs.data.links.map(x => {
      var source = attrs.data.nodes.filter(d => d.node === x.source)[0];
      var target = attrs.data.nodes.filter(d => d.node === x.target)[0];

      return {
        source: source ? source : null,
        target: target ? target : null,
        type: x.type
      }
    }).filter(x => x.source != null && x.target != null)
    // end of data calculations

    // Use the pack layout to initialize node positions.
    d3.layout.pack()
      .sort(null)
      .size([calc.chartWidth, calc.chartHeight])
      .children(function(d) { return d.values; })
      .value(function(d) { return d.radius * d.radius; })
      .nodes({
        values: d3.nest().key(d => d.cluster).entries(nodes_first)
      });

    var force = d3.layout.force()
      .nodes(getNodes())
      .links(getLinks())
      .size([calc.chartWidth, calc.chartHeight])
      .gravity(.02)
      .charge(0)
      .on("tick", tick)

    force.start();

    //////////////////////////////////////////////////////////////
    ///////////////////////// DRAWING ////////////////////////////
    //////////////////////////////////////////////////////////////
		//Add svg
		var svg = container
      .patternify({ tag: 'svg', selector: 'svg-chart-container' })
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
			.attr('width', attrs.svgWidth)
			.attr('height', attrs.svgHeight)
      .attr('font-family', attrs.defaultFont)
      .attr('opacity', 0)
        .call(zoom);

		//Add container g element
		var chart = svg
			.patternify({ tag: 'g', selector: 'chart' })
      .attr('transform', 'translate(' + calc.chartLeftMargin + ',' + calc.chartTopMargin + ')');

    var backRect = chart.patternify({ tag: 'rect', selector: 'back-rect' })
      .attr('fill', 'transparent')
      .attr('width', attrs.svgWidth)
      .attr('height', attrs.svgHeight)
      .on('click', function () {
        if (selectedNode) {
          unselectNode(selectedNode);
        }
      })

    var linksGroup = chart.patternify({ tag: 'g', selector: 'links' });
    var nodesGroup = chart.patternify({ tag: 'g', selector: 'nodes' });

    var node = addNodes();
    var link = addLinks();
    var texts = addTexts();

    toggle = function (mode) {
      attrs.mode = mode;

      force.stop();

      force.nodes(getNodes())
        .links(getLinks())

      node = addNodes();
      link = addLinks();
      texts = addTexts();

      if (attrs.mode == 'first') {
        force
          .gravity(.02)
          .charge(0)

        node.on('mousedown.drag', null)
            .on("mousedown", null);
      } else {
        var linksMapped = force.links().map(d => ({ source: d.source.node, target: d.target.node }));
        var linksGroupped = d3.nest().key(d => d.target).entries(linksMapped)
        var linksCount = {};

        linksGroupped.forEach(d => {
            linksCount[d.key] = d.values.length
        });

        force
          .gravity(0.05)
          .charge(-200)
          .linkDistance(function (d) {
              return Math.max(100, 2 * linksCount[d.target.node])
          })

        node.call(force.drag)
          .on("mousedown", function() { d3.event.stopPropagation(); });
      }

      force.start();

      updateStylesOnZoom(currentScale);
    }

    function tick(e) {
      if (attrs.mode === 'first') {
        node
          .each(cluster(10 * e.alpha * e.alpha))
          .each(collide(.5))
      } else {
        node
          .each(collide(.5))
      }

      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      })

      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    }

    //Zoom functions
    function zoomed () {
      chart.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
      currentScale = d3.event.scale;
      updateStylesOnZoom(currentScale);
    }

    function getNodes () {
      return attrs.mode === 'first' ? nodes_first : nodes_second;
    }

    function getLinks () {
      return attrs.mode === 'first' ? links_first : links_second;
    }

    function addTexts() {
      var text = node.patternify({ 
          tag: 'text', 
          selector: 'node-text', 
          data: d => [d] 
        })
        .attr('text-anchor', 'middle')
        .attr('display', attrs.mode == 'first' ? 'none' : null)
        .attr('font-weight', d => d.type === 'organization' ? 'bold' : null)
        .attr('font-size', attrs.nodesFontSize + 'px')
        .attr('fill', d => d.type === 'people' ? textColorPeople : textColorOrg)
        .attr('dy', d => (d.radius + textNodePadding) / currentScale)
        .text(d => d.node || d.group)

      node.patternify({ 
          tag: 'title', 
          selector: 'node-title', 
          data: d => [d] 
        })
        .text(d => d.node || d.group)

      return text;
    }

    function addLinks () {
      return linksGroup.html("")
        .patternify({ 
          tag: 'line', 
          selector: 'link', 
          data: getLinks() 
        })
        .attr("stroke-width", strokeWidth)
        .attr("stroke", linkColor)
        .attr("stroke-dasharray", d => d.type == 'dotted' ? 3 : 0);
    }

    function addNodes () {
      var node = nodesGroup.html("")
        .patternify({ 
          tag: 'g', 
          selector: 'node', 
          data: getNodes() 
        })
        .attr('data-group', d => d.group)
        .attr('class', function (d) {
          var cl = 'node node-' + d.type;
          return cl;
        })

      var nd = node.patternify({
          tag: 'circle', 
          selector: 'node-circle', 
          data: d => [d] 
        })
        .attr("fill", function(d) {
          if (d.isImage) {
            return '#fff';
          }
          if (d.type === 'organization') {
            return attrs.color_org;
          }
          return color(d.cluster);
        })
        .attr("cursor", 'pointer')
        .attr("stroke-width", strokeWidth)
        .attr("stroke", d => d.isImage ? null : nodeStroke)
        .attr("r", d => d.radius / currentScale)
        .on('click', function(d) {
          // select parent
          var el = d3.select(this.parentElement);
          if (d.clicked) {
            unselectNode(d, el);
          } else {
            selectNode(d, el);
          }
          
          // make pulse effect. Change node's coordinates a little bit and reheat the force.
          var dx = d.x < calc.chartWidth / 2 ? Math.random() * 10 : Math.random() * -10;
          var dy = d.y < calc.chartHeight / 2 ? Math.random() * 10 : Math.random() * -10;
          d.x += dx;
          d.y += dy;

          if (attrs.mode !== 'first')
            force.alpha(.1);
        })
        .on('mouseover', function (d) {
          var that = d3.select(this);
          var parent = d3.select(this.parentElement);
          var text = parent.select('.node-text');

          // move current node to the end
          parent.each(function() {
            this.parentNode.appendChild(this);
          });

          // increase stroke width
          that.attr('stroke-width', strokeWidthSelected / currentScale)
            .attr('fill', nodeColorSelected)
            .attr('stroke', nodeStrokeSelected);

          // show text and make it bold
          text.attr('display', null)
            .attr('font-weight', 'bold')
            .attr('fill', textColorSelected);
        })
        .on('mouseout', function (d) {
          var that = d3.select(this);
          var parent = d3.select(this.parentElement);
          var text = parent.select('.node-text');

          if (d !== selectedNode) {
            that.attr('stroke-width', strokeWidth / currentScale);
          }

          var hideTextsOnScale = attrs.mode == 'first' ? hideTextsOnScaleView1 : hideTextsOnScaleView2;

          if (currentScale < hideTextsOnScale) {
            text.attr('display', () => {
              if (d == selectedNode) {
                return null;
              }
              return 'none';
            });
          }

          if (!d.clicked) {
            if (d.type === 'people') {
              text.attr('font-weight', null)
            }

            text.attr('fill', d.type == 'people' ? textColorPeople : textColorOrg);

            that
              .attr('fill', () => {
                if (d.isImage) {
                  return '#fff';
                }
                if (d.type === 'organization') {
                  return attrs.color_org;
                }
                return color(d.cluster);
              })
              .attr('stroke', d.isImage ? null : nodeStroke)
          }
        })

      node.filter(x => x.isImage)
        .each(function () {
          let that = d3.select(this);

          that.append('image').classed('node-icon', true)
            .attr('xlink:href', d => d.imagePath)
            .attr('width', d => d.radius * 2)
            .attr('height', d => d.radius * 2)
            .attr('transform', d => `translate(${-d.radius}, ${-d.radius})`)
            .attr('pointer-events', 'none')
        })

      return node;
    }

    function unselectNode (d, el) {
      if (!el) {
        el = node.filter(x => x === d);
      }

      var circle = el.select('.node-circle');
      var text = el.select('.node-text');

      d.radius = d.type === 'organization' ? attrs.radius_org : attrs.radius_people;
      d.clicked = false;
      selectedNode = null;

      circle.attr('fill', () => {
        if (d.isImage) {
          return '#fff';
        }
        if (d.type === 'organization') {
          return attrs.color_org;
        }
        return color(d.cluster);
      })
      .attr('stroke', d.isImage ? null : nodeStroke)

      // reduce radius
      circle.attr("r", x => x.radius / currentScale)
        .attr('stroke-width', strokeWidth / currentScale);

      text
        .attr('dy', d => {
          if (d.isImage) {
            return (d.radius * 2 + textNodePadding) / currentScale;
          }
          return (d.radius + textNodePadding) / currentScale;
        })

      if (d.type === 'people') {
        text.attr('font-weight', null)
      }

      var hideTextsOnScale = attrs.mode == 'first' ? hideTextsOnScaleView1 : hideTextsOnScaleView2;
      if (currentScale < hideTextsOnScale) {
        texts.attr('display', 'none')
      }
      else {
        texts.attr('display', null)
      }

      deselectConnectedLinks(d);
      attrs.closeNav(d);
    }

    function selectNode (d, el) {
      if (!el) {
        el = node.filter(x => x === d);
      }

      var circle = el.select('.node-circle');
      var text = el.select('.node-text');

      d.radius = (d.radius * resize_ratio);

      // clear all other nodes clicked property in order
      getNodes().forEach(d => d.clicked = false);

      d.clicked = true;
      selectedNode = d;

      // increase radius
      circle.attr("r", d.radius / currentScale)
        .attr('fill', nodeColorSelected)
        .attr('stroke', nodeStrokeSelected);

      text.attr('font-weight', 'bold')
        .attr('dy', d => {
          return d.isImage ? (d.radius * 2 + textNodePadding) / currentScale : (d.radius + textNodePadding) / currentScale;
        });

      resetOthersButSelected();
      selectConnectedLinks(d);
      attrs.openNav(d);
    }

    function selectConnectedLinks (d) {
      var links = getLinks();
      var connectedLinks = [];

      links.forEach(x => {
        if (x.source == d || x.target == d) {
          connectedLinks.push(x);
        }
      })

      link.filter(x => {
        return connectedLinks.indexOf(x) > -1;
      })
      .attr('stroke-width', strokeWidthSelected / currentScale)
      .attr('stroke', linkColorSelected);
    }

    function deselectConnectedLinks (d) {
      var links = getLinks();
      var connectedLinks = [];

      links.forEach(x => {
        if (x.source == d || x.target == d) {
          connectedLinks.push(x);
        }
      })

      link.filter(x => {
        return connectedLinks.indexOf(x) > -1;
      })
      .attr('stroke-width', strokeWidth / currentScale)
      .attr('stroke', linkColor);
    }

    function resetOthersButSelected () {
      link.filter(d => d.source != selectedNode && d.target != selectedNode)
        .attr('stroke-width',  strokeWidth / currentScale);

      node.filter(d => d != selectedNode)
      .each(function () {
        // reset radius
        getNodes().filter(d => d != selectedNode)
          .forEach(d => {
            d.radius = d.type === 'organization' ? attrs.radius_org : attrs.radius_people;
          })

        let self = d3.select(this);
        let circle = self.select('.node-circle')
        let text = self.select('.node-text');

        circle.attr('stroke-width', d => {
            return strokeWidth / currentScale;
          })
          .attr('r', d => {
            return d.radius / currentScale;
          })
          .attr('fill', (d) => {
            if (d.isImage) {
              return '#fff';
            }
            if (d.type === 'organization') {
              return attrs.color_org;
            }
            return color(d.cluster);
          })
          .attr('stroke', d => d.isImage ? null : nodeStroke)

        text
          .attr('dy', d => {
            return d.isImage ? (d.radius * 2 + textNodePadding) / currentScale : (d.radius + textNodePadding) / currentScale;
          })
      })

      var hideTextsOnScale = attrs.mode == 'first' ? hideTextsOnScaleView1 : hideTextsOnScaleView2;
      if (currentScale < hideTextsOnScale) {
        texts.attr('display', d => {
          if (d == selectedNode) {
            return null;
          }
          return 'none';
        })
      }
      else {
        texts.attr('display', null)
      }

      texts.attr('fill', d => {
        if (d == selectedNode) {
          return textColorSelected;
        }
        return d.type == 'people' ? textColorPeople : textColorOrg;
      })
      .attr('font-weight', d => {
        if (d == selectedNode || d.type == 'organization') {
          return 'bold'
        }
        return null;
      });
    }

    function updateStylesOnZoom (scale) {
      var hideTextsOnScale = attrs.mode == 'first' ? hideTextsOnScaleView1 : hideTextsOnScaleView2;
      var fontSize = attrs.nodesFontSize / scale;

      if (scale < hideTextsOnScale) {
        texts.attr('display', d => {
          if (d == selectedNode) {
            return null;
          }
          return 'none';
        })
      }
      else {
        texts.attr('display', null)
      }

      texts
        .attr('dy', d => d.isImage ? (d.radius * 2 + textNodePadding) / scale : (d.radius + textNodePadding) / scale)
        .attr('font-size', fontSize + 'px')

      link.attr('stroke-width', d => {
        if (d.source == selectedNode || d.target == selectedNode) {
          return strokeWidthSelected / scale;
        }

        return strokeWidth / scale;
      })

      node.each(function (d) {
        let self = d3.select(this);
        let circle = self.select('circle')

        if (d.isImage) {
          self
            .select('image')
            .attr('width', d => d.radius * 2 / scale)
            .attr('height', d => d.radius * 2 / scale)
            .attr('transform', d => `translate(${-d.radius / scale}, ${-d.radius / scale})`)
        }

        circle.attr('stroke-width', d => {
          if (d == selectedNode) {
            return strokeWidthSelected / scale;
          }
          return strokeWidth / scale;
        });

        circle.attr('r', d => {
          return d.radius / scale;
        });
      })
    }

    // Move d to be adjacent to the cluster node.
    function cluster(alpha) {
      return function(d) {
        var cluster = clusters[d.cluster];
        if (cluster === d) return;
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + cluster.radius;
        if (l != r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      };
    }

    // Resolves collisions between d and all other circles.
    function collide(alpha) {
      var quadtree = d3.geom.quadtree(getNodes());
      return function(d) {
        var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }
	};

  // window resize event
  d3.select(window).on('resize.' + attrs.id, function() {
    if (!attrs.container) return;
    var container = d3.select(attrs.container);
    var containerRect = container.node().getBoundingClientRect();
    if (containerRect.width > 0) attrs.svgWidth = containerRect.width;
    d3.select(attrs.container).select('.svg-chart-container').attr('width', attrs.svgWidth);
    // main();
  });

	//----------- PROTOTYPE FUNCTIONS  ----------------------
	d3.selection.prototype.patternify = function(params) {
		var container = this;
		var selector = params.selector;
		var elementTag = params.tag;
		var data = params.data || [ selector ];

		// Pattern in action
		var selection = container.selectAll('.' + selector).data(data, (d, i) => {
			if (typeof d === 'object') {
				if (d.id) {
					return d.id;
				}
			}
			return i;
		});
		selection.exit().remove();
		selection = selection.enter().append(elementTag);
		selection.attr('class', selector);
		return selection;
	};

	//Dynamic keys functions
	Object.keys(attrs).forEach((key) => {
		// Attach variables to main function
		return (main[key] = function(_) {
			var string = `attrs['${key}'] = _`;
			if (!arguments.length) {
				return eval(` attrs['${key}'];`);
			}
			eval(string);
			return main;
		});
	});

	//Set attrs as property
  main.attrs = attrs;

  main.toggle = function (mode) {
    if (typeof toggle === 'function') {
      toggle(mode);
    }
    return main;
  }

  main.currentScale = function () {
    return currentScale;
  }

	//Exposed update functions
	main.data = function(value) {
		if (!arguments.length) return attrs.data;
		attrs.data = value;
		return main;
	};

	// Run  visual
	main.render = function() {
		main();
		return main;
	};

	return main;
}
