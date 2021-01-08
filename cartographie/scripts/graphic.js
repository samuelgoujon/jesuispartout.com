function renderChart() {
  // Exposed variables
  var attrs = {
    id: "ID" + Math.floor(Math.random() * 1000000), // Id for event handlings
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
    container: "body",
    radius_org: 16,
    radius_people: 10,
    iconSize: 20,
    nodesFontSize: 12,
    defaultFont: "Helvetica",
    color_org: "#FFAC1E",
    colors: {},
    data: null,
    areaNames: [],
    openNav: (d) => d,
    closeNav: (d) => d,
  };

  // instance variables
  var currentScale = 1;
  var strokeWidth = 1;
  var strokeWidthSelected = 2;
  var padding = 1.5 + strokeWidth; // separation between same-color nodes
  var resize_ratio = 1.8; // multiply node radius on select
  var textNodePadding = 17;
  var linkColor = "#666";
  var nodeStroke = "#666";
  var textColorPeople = "#666";
  var textColorSelected = "#000";
  var textColorOrg = "#000";
  var linkColorSelected = "#000";
  var nodeColorSelected = "#fff";
  var nodeStrokeSelected = "#000";
  var hideTextsOnScale = 0.8;
  var selectedNode = null;
  var simulation;

  //Main chart object
  var main = function () {
    //Drawing containers
    var container = d3.select(attrs.container);

    //Calculated properties
    var calc = {};
    calc.id = "ID" + Math.floor(Math.random() * 1000000); // id for event handlings
    calc.chartLeftMargin = attrs.marginLeft;
    calc.chartTopMargin = attrs.marginTop;
    calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
    calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

    var color = d => attrs.colors[d];
    let zoom = d3.zoom().scaleExtent([0.5, 10]).on("zoom", zoomed);

    attrs.data.nodes.forEach((d) => {
      d.radius = d.type === "organization" ? attrs.radius_org : attrs.radius_people;
    });

    var linksGroupped = d3.groups(attrs.data.links, (d) => d.target);
    var linksCount = {};

    linksGroupped.forEach(([key, values]) => {
      linksCount[key] = values.length;
    });

    simulation = d3
      .forceSimulation(attrs.data.nodes)
      .force(
        "link",
        d3
          .forceLink(attrs.data.links)
          .id((d) => d.node)
          .distance(function (d) {
            return Math.max(100, 2 * linksCount[d.target.node]);
          })
      )
      .force(
        "center",
        d3.forceCenter(calc.chartWidth / 2, calc.chartHeight / 2)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force(
        "collide",
        d3.forceCollide().radius((d) => {
          return d.radius + padding;
        })
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", tick);

    //////////////////////////////////////////////////////////////
    ///////////////////////// DRAWING ////////////////////////////
    //////////////////////////////////////////////////////////////
    //Add svg
    var svg = container
      .patternify({ tag: "svg", selector: "svg-chart-container" })
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("width", attrs.svgWidth)
      .attr("height", attrs.svgHeight)
      .attr("font-family", attrs.defaultFont)
      .attr("opacity", 0)
      .call(zoom);

    var backRect = svg
      .patternify({ tag: "rect", selector: "back-rect" })
      .attr("fill", "transparent")
      .attr("width", attrs.svgWidth)
      .attr("height", attrs.svgHeight)
      .on("click", function () {
        if (selectedNode) {
          unselectNode(selectedNode);
        }
      });

    //Add container g element
    var chart = svg
      .patternify({ tag: "g", selector: "chart" })
      .attr(
        "transform",
        "translate(" + calc.chartLeftMargin + "," + calc.chartTopMargin + ")"
      )
      .patternify({ tag: "g", selector: "chart-inner" });

    var linksGroup = chart.patternify({ tag: "g", selector: "links" });
    var nodesGroup = chart.patternify({ tag: "g", selector: "nodes" });

    var node = addNodes();
    var link = addLinks();
    var texts = addTexts();

    function tick(e) {
      node.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

      link
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        });
    }

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
    }

    function zoomed({ transform }) {
      chart.attr("transform", transform);
      currentScale = transform.k;
      updateStylesOnZoom(currentScale);
    }

    function addTexts() {
      var text = node
        .patternify({
          tag: "text",
          selector: "node-text",
          data: (d) => [d],
        })
        .attr("text-anchor", "middle")
        .attr("font-weight", (d) => (d.type === "organization" ? "bold" : null))
        .attr("font-size", attrs.nodesFontSize + "px")
        .attr("fill", (d) =>
          d.type === "people" ? textColorPeople : textColorOrg
        )
        .attr("dy", (d) => (d.radius + textNodePadding) / currentScale)
        .text((d) => d.node || d.group);

      node
        .patternify({
          tag: "title",
          selector: "node-title",
          data: (d) => [d],
        })
        .text((d) => d.node || d.group);

      return text;
    }

    function addLinks() {
      return linksGroup
        .patternify({
          tag: "line",
          selector: "link",
          data: attrs.data.links,
        })
        .attr("stroke-width", strokeWidth)
        .attr("stroke", linkColor)
        .attr("stroke-dasharray", (d) => (d.type == "dotted" ? 3 : 0));
    }

    function addNodes() {
      var node = nodesGroup
        .patternify({
          tag: "g",
          selector: "node",
          data: attrs.data.nodes,
        })
        .attr("data-group", (d) => d.group)
        .attr("class", function (d) {
          var cl = "node node-" + d.type;
          return cl;
        })
        .call(drag(simulation));

      var nd = node
        .patternify({
          tag: "circle",
          selector: "node-circle",
          data: (d) => [d],
        })
        .attr("fill", function (d) {
          if (d.isImage) {
            return "#fff";
          }

          if (d.type === "organization") {
            return attrs.color_org;
          }

          return color(d.area);
        })
        .attr("cursor", "pointer")
        .attr("stroke-width", strokeWidth)
        .attr("stroke", (d) => (d.isImage ? null : nodeStroke))
        .attr("r", (d) => d.radius / currentScale)
        .on("click", function (e, d) {
          // select parent
          var el = d3.select(this.parentElement);

          if (d.clicked) {
            unselectNode(d, el);
          } else {
            selectNode(d, el);
          }

          // make pulse effect. Change node's coordinates a little bit and reheat the force.
          var dx =
            d.x < calc.chartWidth / 2
              ? Math.random() * 10
              : Math.random() * -10;
          var dy =
            d.y < calc.chartHeight / 2
              ? Math.random() * 10
              : Math.random() * -10;
          d.x += dx;
          d.y += dy;
        })
        .on("mouseover", function (e, d) {
          var that = d3.select(this);
          var parent = d3.select(this.parentElement);
          var text = parent.select(".node-text");

          // move current node to the end
          that.raise();

          // increase stroke width
          that
            .attr("stroke-width", strokeWidthSelected / currentScale)
            .attr("fill", nodeColorSelected)
            .attr("stroke", nodeStrokeSelected);

          // show text and make it bold
          text
            .attr("display", null)
            .attr("font-weight", "bold")
            .attr("fill", textColorSelected);
        })
        .on("mouseout", function (e, d) {
          var that = d3.select(this);
          var parent = d3.select(this.parentElement);
          var text = parent.select(".node-text");

          if (d !== selectedNode) {
            that.attr("stroke-width", strokeWidth / currentScale);
          }

          if (currentScale < hideTextsOnScale) {
            text.attr("display", () => {
              if (d == selectedNode) {
                return null;
              }
              return "none";
            });
          }

          if (!d.clicked) {
            if (d.type === "people") {
              text.attr("font-weight", null);
            }

            text.attr(
              "fill",
              d.type == "people" ? textColorPeople : textColorOrg
            );

            that
              .attr("fill", () => {
                if (d.isImage) {
                  return "#fff";
                }
                if (d.type === "organization") {
                  return attrs.color_org;
                }
                return color(d.area);
              })
              .attr("stroke", d.isImage ? null : nodeStroke);
          }
        });

      node
        .filter((x) => x.isImage)
        .each(function () {
          let that = d3.select(this);

          that
            .append("image")
            .classed("node-icon", true)
            .attr("xlink:href", (d) => d.imagePath)
            .attr("width", (d) => d.radius * 2)
            .attr("height", (d) => d.radius * 2)
            .attr("transform", (d) => `translate(${-d.radius}, ${-d.radius})`)
            .attr("pointer-events", "none");
        });

      return node;
    }

    function unselectNode(d, el) {
      if (!el) {
        el = node.filter((x) => x === d);
      }

      var circle = el.select(".node-circle");
      var text = el.select(".node-text");

      d.radius = d.type === "organization" ? attrs.radius_org : attrs.radius_people;
      d.clicked = false;
      selectedNode = null;

      circle
        .attr("fill", () => {
          if (d.isImage) {
            return "#fff";
          }
          if (d.type === "organization") {
            return attrs.color_org;
          }
          return color(d.area);
        })
        .attr("stroke", d.isImage ? null : nodeStroke);

      // reduce radius
      circle
        .attr("r", (x) => x.radius / currentScale)
        .attr("stroke-width", strokeWidth / currentScale);

      text.attr("dy", (d) => {
        if (d.isImage) {
          return (d.radius * 2 + textNodePadding) / currentScale;
        }
        return (d.radius + textNodePadding) / currentScale;
      });

      if (d.type === "people") {
        text.attr("font-weight", null);
      }

      if (currentScale < hideTextsOnScale) {
        texts.attr("display", "none");
      } else {
        texts.attr("display", null);
      }

      deselectConnectedLinks(d);
      attrs.closeNav(d);
    }

    function selectNode(d, el) {
      if (!el) {
        el = node.filter((x) => x === d);
      }

      var circle = el.select(".node-circle");
      var text = el.select(".node-text");

      d.radius = d.radius * resize_ratio;

      // clear all other nodes clicked property in order
      attrs.data.nodes.forEach((d) => (d.clicked = false));

      d.clicked = true;
      selectedNode = d;

      // increase radius
      circle
        .attr("r", d.radius / currentScale)
        .attr("fill", nodeColorSelected)
        .attr("stroke", nodeStrokeSelected);

      text.attr("font-weight", "bold").attr("dy", (d) => {
        return d.isImage
          ? (d.radius * 2 + textNodePadding) / currentScale
          : (d.radius + textNodePadding) / currentScale;
      });

      resetOthersButSelected();
      selectConnectedLinks(d);
      attrs.openNav(d);
    }

    function selectConnectedLinks(d) {
      var links = attrs.data.links;
      var connectedLinks = [];

      links.forEach((x) => {
        if (x.source == d || x.target == d) {
          connectedLinks.push(x);
        }
      });

      link
        .filter((x) => {
          return connectedLinks.indexOf(x) > -1;
        })
        .attr("stroke-width", strokeWidthSelected / currentScale)
        .attr("stroke", linkColorSelected);
    }

    function deselectConnectedLinks(d) {
      var links = attrs.data.links;
      var connectedLinks = [];

      links.forEach((x) => {
        if (x.source == d || x.target == d) {
          connectedLinks.push(x);
        }
      });

      link
        .filter((x) => {
          return connectedLinks.indexOf(x) > -1;
        })
        .attr("stroke-width", strokeWidth / currentScale)
        .attr("stroke", linkColor);
    }

    function resetOthersButSelected() {
      link
        .filter((d) => d.source != selectedNode && d.target != selectedNode)
        .attr("stroke-width", strokeWidth / currentScale);

      node
        .filter((d) => d != selectedNode)
        .each(function () {
          // reset radius
          attrs.data.nodes
            .filter((d) => d != selectedNode)
            .forEach((d) => {
              d.radius =
                d.type === "organization"
                  ? attrs.radius_org
                  : attrs.radius_people;
            });

          let self = d3.select(this);
          let circle = self.select(".node-circle");
          let text = self.select(".node-text");

          circle
            .attr("stroke-width", (d) => {
              return strokeWidth / currentScale;
            })
            .attr("r", (d) => {
              return d.radius / currentScale;
            })
            .attr("fill", (d) => {
              if (d.isImage) {
                return "#fff";
              }
              if (d.type === "organization") {
                return attrs.color_org;
              }
              return color(d.area);
            })
            .attr("stroke", (d) => (d.isImage ? null : nodeStroke));

          text.attr("dy", (d) => {
            return d.isImage
              ? (d.radius * 2 + textNodePadding) / currentScale
              : (d.radius + textNodePadding) / currentScale;
          });
        });

      if (currentScale < hideTextsOnScale) {
        texts.attr("display", (d) => {
          if (d == selectedNode) {
            return null;
          }
          return "none";
        });
      } else {
        texts.attr("display", null);
      }

      texts
        .attr("fill", (d) => {
          if (d == selectedNode) {
            return textColorSelected;
          }
          return d.type == "people" ? textColorPeople : textColorOrg;
        })
        .attr("font-weight", (d) => {
          if (d == selectedNode || d.type == "organization") {
            return "bold";
          }
          return null;
        });
    }

    function updateStylesOnZoom(scale) {
      var fontSize = attrs.nodesFontSize / scale;

      if (scale < hideTextsOnScale) {
        texts.attr("display", (d) => {
          if (d == selectedNode) {
            return null;
          }
          return "none";
        });
      } else {
        texts.attr("display", null);
      }

      texts
        .attr("dy", (d) =>
          d.isImage
            ? (d.radius * 2 + textNodePadding) / scale
            : (d.radius + textNodePadding) / scale
        )
        .attr("font-size", fontSize + "px");

      link.attr("stroke-width", (d) => {
        if (d.source == selectedNode || d.target == selectedNode) {
          return strokeWidthSelected / scale;
        }

        return strokeWidth / scale;
      });

      node.each(function (d) {
        let self = d3.select(this);
        let circle = self.select("circle");

        if (d.isImage) {
          self
            .select("image")
            .attr("width", (d) => (d.radius * 2) / scale)
            .attr("height", (d) => (d.radius * 2) / scale)
            .attr(
              "transform",
              (d) => `translate(${-d.radius / scale}, ${-d.radius / scale})`
            );
        }

        circle.attr("stroke-width", (d) => {
          if (d == selectedNode) {
            return strokeWidthSelected / scale;
          }
          return strokeWidth / scale;
        });

        circle.attr("r", (d) => {
          return d.radius / scale;
        });
      });
    }
  };

  makeChain(attrs, main);

  main.currentScale = function () {
    return currentScale;
  };

  //Exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    return main;
  };

  // Run  visual
  main.render = function () {
    main();
    // window resize event
    d3.select(window).on("resize." + attrs.id, function () {
      if (!attrs.container) return;
      var container = d3.select(attrs.container);
      var containerRect = container.node().getBoundingClientRect();
      if (containerRect.width > 0) attrs.svgWidth = containerRect.width;
      d3.select(attrs.container)
        .select(".svg-chart-container")
        .attr("width", attrs.svgWidth);
    });
    return main;
  };

  return main;
}
