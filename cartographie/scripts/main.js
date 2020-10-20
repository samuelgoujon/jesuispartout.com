var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

if (isMobile.any()) {
    document.body.classList.add('mobile');
}

function imageExists(image_url, callback, reject){
    var http = new XMLHttpRequest();

    http.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                callback();
            } else if (reject) {
                reject();
            }
        }
    }

    http.open('HEAD', image_url, true);
    http.send();
}

function openNav(d) {
    var portrait = document.getElementById('portrait');
    document.getElementById('node').innerHTML = d.node
    if (d.type == "people") {
        ['position',
         'group',
         'membership',
         'education',
         'reference',
         'political_party'].forEach(x => {
            let el = document.getElementById(x)
            if (d[x.replace('_', ' ')].length == 0) {
                el.parentElement.style.display = 'none'
            } else {
                el.innerHTML = d[x.replace('_', ' ')]
                el.parentElement.style.display = 'block'
            }
         })

         d3.selectAll('.org').style('display', 'none');

         var image_url = 'img/portraits/' + d.node + '.jpg';

         imageExists(image_url, function () {
            portrait.src = image_url;
            portrait.classList.remove('d-none');
         }, function () {
            portrait.classList.add('d-none');
         });
    }
    else {
        portrait.classList.add('d-none');
        let el = document.getElementById('referenceOrg')
        if (d.reference.length == 0) {
            el.parentElement.style.display = 'none'
        } else {
            el.parentElement.style.display = 'block'
            el.innerHTML = d.reference
        }

        d3.selectAll('.people').style('display', 'none')
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

d3.queue()
.defer(d3.csv, "./data/nodes.csv")
.defer(d3.csv, "./data/connections.csv")
.await(function (error, nodes, links) {
    var people = nodes.filter(d => d.type !== 'organization');
    var organizations = nodes.filter(d => d.type === 'organization');

    var areas = d3.nest().key(d => d.area).entries(people);
    var charts = [];
    var activeChart;

    areas.forEach(area => {
        var container = d3.select('div[data-area="' + area.key + '"]').node();

        var _links = links.filter(x => {
            return area.values.some(d => d.area === area.key && d.node === x.source)
        });

        var _nodes = area.values.concat(organizations.filter(d => {
            return _links.some(x => x.target === d.node)
        }));

        var chart = renderChart()
            .svgHeight(window.innerHeight)
            .svgWidth(window.innerWidth)
            .container(container)
            .openNav(openNav)
            .closeNav(closeNav)
            .data({
                nodes: JSON.parse(JSON.stringify(_nodes)),
                links: JSON.parse(JSON.stringify(_links))
            })
            .render();

        charts.push({
            area: area.key,
            chart: chart
        });
    })

    function selectChart (area) {
        var chartObj = charts.filter(x => x.area === area)[0];
        activeChart = chartObj ? chartObj.chart : null;
    }

    function toggleMode () {
        let self = d3.select(this);
        if (self.attr('data-mode') === 'first') {
            self.attr('data-mode', 'second');
            self.html("Cartographie");
        } else {
            self.attr('data-mode', 'first')
            self.html("Réseaux");
        }

        if (activeChart) {
            activeChart.toggle(self.attr('data-mode'));
        }
    }

    d3.select('#viewToggler')
        .style('opacity', 0)
        .on('click', toggleMode)

    d3.selectAll('.area-link')
        .on('click', function () {
            var that = d3.select(this);
            var navItems = d3.selectAll('.area-link');

            navItems.classed('active', false).classed('show', false);
            that.classed('show', true);
            var area = that.attr('data-area');

            selectChart(area);
            if (activeChart) {
                d3.select('#viewToggler').attr('data-mode', activeChart.mode());

                if (activeChart.mode() === 'first') {
                    d3.select('#viewToggler').html("Réseaux");
                } else {
                    d3.select('#viewToggler').html("Cartographie");
                }
            }

            if (!that.attr('area-toggled')) {
                setTimeout(() => {
                    $('#viewToggler').trigger('click')
                    that.attr('area-toggled', true)
                }, 100);
            }
        })

    selectChart("Politique")

    setTimeout(() => {
        d3.select('.area-link').attr('area-toggled', true)
        $('#viewToggler').trigger('click')
        d3.selectAll('.svg-chart-container').attr('opacity', 1)
        d3.select('#viewToggler')
        .style('opacity', 1)
    }, 100);
})
