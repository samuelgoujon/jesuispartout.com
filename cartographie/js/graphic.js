function renderChart() {

    // Exposed variables
    var attrs = {
      id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
      svgWidth: 400,
      svgHeight: 400,
      marginTop: 5,
      marginBottom: 5,
      marginRight: 5,
      marginLeft: 5,
      orgRadius: 80,
      nodesFontSize: 11,
      orgFontSize: 16,
      panDuration: 1000,
      container: 'body',
      defaultTextFill: '#2C3E50',
      defaultFont: 'Helvetica',
      data: null
    };


    //InnerFunctions which will update visuals
    var updateData, panToCenter, resetZoom;

    //Main chart object
    var main = function (selection) {
      selection.each(function scope() {

        let currentSelection = null;
        let currentScale = d3.zoomIdentity.k;
        let ceptureTransform = true;

        //Calculated properties
        var calc = {}
        calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
        calc.chartLeftMargin = attrs.marginLeft;
        calc.chartTopMargin = attrs.marginTop;
        calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
        calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

        let currentTransform = {
            x: calc.chartLeftMargin + calc.chartWidth / 2,
            y: calc.chartTopMargin + calc.chartHeight / 2
        };

        let zoom = d3.zoom()
          .scaleExtent([0.4, 5])
          .on("zoom", zoomed)

        let colorScale = d3.scaleOrdinal().domain([
            'Libéraux', 'Nationalistes', 'Conservateurs', 'Identitaires', 'Contre-révolutionnaires', 'Nationaux-révolutionnaires'
        ]).range([
            '#fcaa17', '#323232', '#00aeef', '#0c4f99', '#fff', '#BC3230'
        ])

        let scaleRadius = d3.scaleLinear()
            .domain([
                d3.min(attrs.data, d => +d.weight),
                d3.max(attrs.data, d => +d.weight)
            ])
            .range([10, 20])

        let groupsAndLinks = getGroupsAndLinks()

        let nodes = attrs.data.concat(groupsAndLinks.groups)
        let links = groupsAndLinks.links

        let simulation = d3.forceSimulation(nodes)
            .velocityDecay(0.8)
            .force("link", d3.forceLink(links)
                             .id(d => d.node)
                             .distance(d => d.distance)
            )
            .force('charge', d3.forceManyBody().strength(d => {
                let charge = d.isGroup ? -300 : -200;

                if (currentSelection && currentSelection.node == d.node) {
                    charge *= 20;
                }

                return charge;
            }))
            .force('collide', d3.forceCollide()
                .radius(d => {
                    let radius = d.isGroup ? attrs.orgRadius * 1.5 : scaleRadius(+d.weight) * 3
                    if (currentSelection && currentSelection.node == d.node) {
                        radius *= 2
                    }
                    return radius / currentScale
                })
                .iterations(1)
            )
            .force('x', d3.forceX(0).strength(0.06))
            .force('y', d3.forceY(0).strength(0.08))
            .on("tick", ticked);

        //Drawing containers
        var container = d3.select(this);

        //Add svg
        var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
          .attr('width', attrs.svgWidth)
          .attr('height', attrs.svgHeight)
          .attr('font-family', attrs.defaultFont)
          .call(zoom);

        //Add container g element
        var chart = svg.patternify({ tag: 'g', selector: 'chart' })
          .attr('transform', `translate(${calc.chartLeftMargin + calc.chartWidth / 2}, ${calc.chartTopMargin + calc.chartHeight / 2})`);

        let linkSelection = chart.patternify({ tag: 'line', selector: 'link', data: links })
          .attr("stroke-width", 1)
          .attr("stroke", 'black')

        let nodeSelection = chart.patternify({ tag: 'g', selector: 'node', data: nodes })
        .attr('data-index', (d, i) => i)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

        let nodeCircles = nodeSelection.patternify({
                tag: function (d) {
                    return document.createElementNS('http://www.w3.org/2000/svg', d.isGroup ? 'ellipse' : 'circle');
                },
                selector: 'node-circle',
                data: d => [d]
            })
            .attr('r', d => {
                if (d.isGroup) {
                    return null
                }
                return scaleRadius(+d.weight)
            })
            .attr('rx', d => {
                if (!d.isGroup) {
                    return null;
                }
                return attrs.orgRadius;
            })
            .attr('ry', d => {
                if (!d.isGroup) {
                    return null;
                }
                return attrs.orgRadius / 2;
            })
            .attr('fill', d => {
                if (d.isGroup) {
                    return colorScale(d.node);
                }
                return '#fff';
            })
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .attr('cursor', d => d.isGroup ? null : 'pointer')
            .on('mouseover', function (d) {
                if (!d.isGroup) {
                    d3.select(d3.select(this).node().parentElement)
                      .select('text')
                      .attr('font-weight', 'bold')
                      .attr('display', null)

                    d3.select(this)
                      .attr('stroke-width', 2 / currentScale)
                }
            })
            .on('mouseout', function (d) {
                if (!d.isGroup) {
                    d3.select(d3.select(this).node().parentElement)
                      .select('text')
                      .attr('font-weight', null)
                      .attr('display', currentScale < 1 ? 'none' : null)

                    d3.select(this)
                      .attr('stroke-width', 1 / currentScale)
                }
            })
            .on('click', d => {
                if (!d.isGroup) {
                    window.open(d.url, "_blank")
                    select(d)
                }
            })

        let texts = nodeSelection.patternify({ tag: 'text', selector: 'title', data: d => [d] })
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', d => {
                if (d.isGroup) {
                    if (d.node.split('-').length > 1) {
                        return -8
                    } else {
                        return 4
                    }
                }
                return scaleRadius(+d.weight) + attrs.nodesFontSize * 1.5
            })
            .attr('data-isgroup', d => d.isGroup ? 1 : 0)
            .attr('fill', d => {
                if (d.isGroup && d.node != 'Contre-révolutionnaires') {
                    return '#fff'
                };
                return '#000';
            })
            .attr('font-weight', d => d.isGroup ? 'bold' : null)
            .attr('font-size', d => d.isGroup ? attrs.orgFontSize + 'px' : attrs.nodesFontSize + 'px')
            .attr('dy', 0)
            .attr('text-decoration', d => d.isGroup ? 'underline' : null)
            .text(d => d.node)
            .call(wrap, 120)

        function dragstarted(d) {
            if (d.isGroup) return
            if (!d3.event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            if (d.isGroup) return
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (d.isGroup) return
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        //Zoom functions
        function zoomed () {
            let x = d3.event.transform.x + calc.chartWidth / 2 + attrs.marginLeft
            let y = d3.event.transform.y + calc.chartHeight / 2 + attrs.marginTop

            chart.attr("transform", `translate(${x}, ${y}) scale(${d3.event.transform.k})`)

            if (ceptureTransform) {
                currentTransform.x = x;
                currentTransform.y = y;
                currentScale = d3.event.transform.k;
            }
            updateStylesOnZoom(d3.event.transform.k)
        }

        function ticked () {
            linkSelection
                .attr("x1", d => d.source.x)
                .attr("x2", d => d.target.x)
                .attr("y1", d => d.source.y)
                .attr("y2", d => d.target.y)

            nodeSelection
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        }

        function select(d) {
            currentSelection = d;
        }

        function deselect() {
            currentSelection = null;
        }

        function centerNode(xx, yy){
            ceptureTransform = false;
            var target = {
                x: -xx,
                y: -yy,
                k: 1
            };

            svg.transition()
                .duration(attrs.panDuration)
                .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(target.x, target.y)
                      .scale(target.k)
                )
                .on('end', () => {
                    ceptureTransform = true;
                })
        }

        panToCenter = function (d) {
            let node = nodeSelection.filter(x => x.node == d);

            let data = node.data();

            if (data.length) {
                centerNode(data[0].x, data[0].y);
            }

            node.select('circle').classed('selected', true);
        }

        resetZoom = function () {
            // ############### reset was disabled ###################
            // ######################################################
            // svg.transition()
            //     .duration(attrs.panDuration)
            //     .call(
            //         zoom.transform,
            //         d3.zoomIdentity.translate(currentTransform.x - calc.chartWidth / 2 - attrs.marginLeft,
            //                                   currentTransform.y - calc.chartHeight / 2 - attrs.marginTop)
            //                        .scale(currentScale)
            //     )
            //     .on('end', () => {
            //         ceptureTransform = true;
            //     })

            chart.selectAll('circle.selected').classed('selected', false)
        }

        // Smoothly handle data updating
        updateData = function () {

        }

        handleWindowResize();

        function updateStylesOnZoom (scale) {
            if (scale < 1) {
                texts.filter(d => !d.isGroup).attr('display', 'none')
            }
            else {
                texts.filter(d => !d.isGroup).attr('display', null)
            }

            let fontSize = attrs.nodesFontSize / scale;

            nodeCircles.filter(d => !d.isGroup)
                .attr('r', d => scaleRadius(+d.weight) / scale)

            nodeCircles.filter(d => d.isGroup)
                .attr('rx', attrs.orgRadius / scale)
                .attr('ry', attrs.orgRadius / (scale * 2))

            texts.filter(d => !d.isGroup)
                .attr('y', d => scaleRadius(+d.weight) / scale + fontSize * 1.5)
                .attr('font-size', fontSize + 'px')

            texts.filter(d => d.isGroup)
                .attr('font-size', attrs.orgFontSize / scale + 'px')
                .attr('y', d => {
                    if (d.node.split('-').length > 1) {
                        return -8 / scale
                    } else {
                        return 4 / scale
                    }
                })
                .selectAll('tspan')
                .each(function() {
                    let that = d3.select(this)

                    that.attr('y', d3.select(that.node().parentElement).attr('y'))
                })

            nodeCircles.attr('stroke-width', 1 / scale)
            linkSelection.attr('stroke-width', 1 / scale)
        }

        //#########################################  UTIL FUNCS ##################################
        function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this)
                // do not wrap non-group texts
                if (text.attr('data-isgroup') == "0") return;

                var words = text.text().split('-').reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    x = parseFloat(text.attr("x")),
                    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join("-"));
                    if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                        line.pop();
                        tspan.text(line.join("-"));
                        line = [word];
                        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        function getGroupsAndLinks () {
            let groups = [];
            let links = [];

            attrs.data.forEach(d => {
                let gs = d.group.split(',').map(x => x.trim());

                gs.forEach(g => {
                    let group = {
                        node: g,
                        group: '',
                        isGroup: true
                    }

                    if (groups.filter(d => d.node == g).length == 0) {
                        groups.push(group)
                    }

                    links.push({
                        source: d,
                        target: groups.filter(d => d.node == g)[0],
                        distance: gs.length * 120
                    })
                })
            })

            return {
                groups,
                links
            };
        }

        function handleWindowResize() {
          d3.select(window).on('resize.' + attrs.id, function () {
            setDimensions();
          });
        }

        function setDimensions() {
          setSvgWidthAndHeight();
          container.call(main);
        }

        function setSvgWidthAndHeight() {
          var containerRect = container.node().getBoundingClientRect();
          if (containerRect.width > 0)
            attrs.svgWidth = containerRect.width;
          if (containerRect.height > 0)
            attrs.svgHeight = containerRect.height;
        }

        function debug() {
          if (attrs.isDebug) {
            //Stringify func
            var stringified = scope + "";

            // Parse variable names
            var groupVariables = stringified
              //Match var x-xx= {};
              .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
              //Match xxx
              .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
              //Get xxx
              .map(v => v[0].trim())

            //Assign local variables to the scope
            groupVariables.forEach(v => {
              main['P_' + v] = eval(v)
            })
          }
        }
        debug();
      });
    };

    //----------- PROTOTYEPE FUNCTIONS  ----------------------
    d3.selection.prototype.patternify = function (params) {
      var container = this;
      var selector = params.selector;
      var elementTag = params.tag;
      var data = params.data || [selector];

      // Pattern in action
      var selection = container.selectAll('.' + selector).data(data, (d, i) => {
        if (typeof d === "object") {
          if (d.id) {
            return d.id;
          }
        }
        return i;
      })
      selection.exit().remove();
      selection = selection.enter().append(elementTag).merge(selection)
      selection.attr('class', selector);
      return selection;
    }

    //Dynamic keys functions
    Object.keys(attrs).forEach(key => {
      // Attach variables to main function
      return main[key] = function (_) {
        var string = `attrs['${key}'] = _`;
        if (!arguments.length) { return eval(` attrs['${key}'];`); }
        eval(string);
        return main;
      };
    });

    //Set attrs as property
    main.attrs = attrs;

    main.panToCenter = function (d) {
        if (typeof panToCenter === "function") {
            panToCenter(d);
        }
    }

    main.resetZoom = function () {
        if (typeof resetZoom === "function") {
            resetZoom();
        }
    }

    //Debugging visuals
    main.debug = function (isDebug) {
      attrs.isDebug = isDebug;
      if (isDebug) {
        if (!window.charts) window.charts = [];
        window.charts.push(main);
      }
      return main;
    }

    //Exposed update functions
    main.data = function (value) {
      if (!arguments.length) return attrs.data;
      attrs.data = value;
      if (typeof updateData === 'function') {
        updateData();
      }
      return main;
    }

    // Run  visual
    main.run = function () {
      d3.selectAll(attrs.container).call(main);
      return main;
    }

    return main;
  }
