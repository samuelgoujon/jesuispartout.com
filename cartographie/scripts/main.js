var charts = [];
var activeChart;

function imageExists(image_url, callback, reject) {
  var http = new XMLHttpRequest();

  http.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        callback();
      } else if (reject) {
        reject();
      }
    }
  };

  http.open("HEAD", image_url, true);
  http.send();
}

function loadWiki(wikipedia, callback, reject) {
    var http = new XMLHttpRequest();

    http.onreadystatechange = function () {
    if (this.readyState == 4) {
        if (this.status == 200) {
            console.log(this);
            callback();
        } else if (reject) {
            reject();
        }
    }
    };

    http.open("GET", wikipedia, true);
    http.setRequestHeader("Origin", "*");
    http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    http.send();
}

function openNav(d) {
  var portrait = document.getElementById("portrait");

  document.getElementById("node").innerHTML = d.node;

  if (d.type == "people") {
    d3.selectAll(".org").style("display", "none");

    var image_url = "img/portraits/" + d.node + ".jpg";

    if (d.image) {
      portrait.src = image_url;
      portrait.classList.remove("d-none");
    } else {
      portrait.classList.add("d-none");
    }

     imageExists(
       image_url,
       function () {
         portrait.src = image_url;
         portrait.classList.remove("d-none");
       },
       function () {
         portrait.classList.add("d-none");
       }
     );

     if (d.wikipedia) {
         loadWiki(
             d.wikipedia,
             function() {
              item.classList.add("d-none");

             },
             function() {

             }
         )
    }

  } else {
    portrait.classList.add("d-none");
    d3.selectAll(".people").style("display", "none");
  }

  document.getElementById("sidenav").style.right = "0px";
}

function closeNav(d) {
  if (isMobile.any()) {
    document.getElementById("sidenav").style.right = "-100%";
  } else {
    document.getElementById("sidenav").style.right = "-400px";
  }
}

function getAreaLevelData(all_nodes, all_links) {
  // group organizations by area
  var organizations = all_nodes.filter((d) => d.type === "organization");
  var areas = d3.groups(organizations, (d) => d.area);

  // container to same area level data, people + organizations
  var areaNodes = {};
  var areaLinks = {};
  var areaNames = [];

  areas.forEach(([key, values]) => {
    areaNodes[key] = values;
    areaLinks[key] = [];
    areaNames.push(key);
  });

  // lookup area by organization
  var orgToArea = {};
  organizations.forEach((d) => (orgToArea[d.node] = d.area));

  var people = new Map(
    all_nodes.filter((d) => d.type !== "organization").map((d) => [d.node, d])
  );

  all_links.forEach((d) => {
    let area = orgToArea[d.target] || orgToArea[d.source];

    if (area) {
      let node = people.get(d.source) || people.get(d.target);

      if (node) {
        if (!areaNodes[area].some(d => d.node === node.node)) {
          areaNodes[area].push({
            ...node,
            area: area
          });
        }
        areaLinks[area].push(d);
      }
    }
  });

  return {
    areaNodes,
    areaLinks,
    areaNames,
  };
}

function selectChart(area) {
  var chartObj = charts.filter((x) => x.area === area)[0];
  activeChart = chartObj ? chartObj.chart : null;
}

function init() {
  Promise.all([
    d3.csv("./data/nodes.csv", d3.autoType),
    d3.csv("./data/connections.csv", d3.autoType),
  ]).then((resp) => {
    const colors = ["#B0E2A7", "#8DA5A7", "#D0BAE8", "#53B8C6"];
    const colorMap = {};

    const {
        areaNodes,
        areaLinks,
        areaNames
    } = getAreaLevelData(resp[0], resp[1]);

    areaNames.forEach((area, i) => {
      colorMap[area] = colors[i];

      var container = d3.select('div[data-area="' + area + '"]').node();

      var _links = areaLinks[area];
      var _nodes = areaNodes[area];

      var chart = renderChart()
        .svgHeight(window.innerHeight)
        .svgWidth(window.innerWidth)
        .container(container)
        .openNav(openNav)
        .closeNav(closeNav)
        .colors(colorMap)
        .data({
          nodes: JSON.parse(JSON.stringify(_nodes)),
          links: JSON.parse(JSON.stringify(_links)),
        })
        .render();

      charts.push({
        area: area,
        chart: chart,
      });
    });

    d3.selectAll(".area-link").on("click", function () {
      var that = d3.select(this);
      var navItems = d3.selectAll(".area-link");

      navItems.classed("active", false).classed("show", false);
      that.classed("show", true);
      var area = that.attr("data-area");

      selectChart(area);
    });

    selectChart("Politique");

    setTimeout(() => {
      d3.select(".area-link").attr("area-toggled", true);
      d3.selectAll(".svg-chart-container").attr("opacity", 1);
    }, 100);
  });
}

window.addEventListener("DOMContentLoaded", function () {
  if (isMobile.any()) {
    document.body.classList.add("mobile");
  }

  init();
});
