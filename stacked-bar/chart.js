const width = 1000,
  height = 500;
const margin = { top: 20, right: 110, bottom: 60, left: 55 };

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

d3.csv("data/data.csv", d3.autoType)
  .then((data) => {
    const first = data.columns[0];
    const keys = data.columns.slice(1); // fonts d'energia
    const series = d3.stack().keys(keys)(data);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d[first]))
      .range([margin.left, width - margin.right])
      .padding(0.15);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    const palette = {
      Bioenergy: "#8c6d31",
      Coal: "#444444",
      Gas: "#e08e2b",
      Hydro: "#2b7bba",
      Nuclear: "#9b59b6",
      Solar: "#f2c200",
      Wind: "#4caf7a",
    };
    const color = d3
      .scaleOrdinal()
      .domain(keys)
      .range(keys.map((k) => palette[k] || "#999"));

    // Barres apilades
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (s) => color(s.key))
      .selectAll("rect")
      .data((s) => s.map((d) => ({ ...d, key: s.key })))
      .join("rect")
      .attr("x", (d) => x(d.data[first]))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .append("title")
      .text(
        (d) => `${d.data[first]} · ${d.key}: ${(d[1] - d[0]).toFixed(1)} %`,
      );

    const ticks = x.domain();
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(ticks))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Eix Y en %
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => d + " %"),
      );

    // Llegenda (en ordre invers perquè coincideixi amb l'apilat)
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - margin.right + 15},${margin.top})`,
      );
    [...keys].reverse().forEach((k, i) => {
      const g = legend.append("g").attr("transform", `translate(0,${i * 22})`);
      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(k));
      g.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("font-size", 12)
        .text(k);
    });
  })
  .catch((err) => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<p style="color:red">Error carregant dades: ${err.message}</p>`,
    );
  });
