// Barres apilades (D3 v7): mix elèctric d'Espanya, % de cada font per mes (REE, via Statista).
// El CSV té la primera columna sense nom (els mesos) i una columna per font.

const W = 1000,
  H = 500;
const M = { top: 20, right: 110, bottom: 60, left: 55 };
// Un color per font, en l'ordre de les columnes: Bioenergy, Coal, Gas, Hydro, Nuclear, Solar, Wind
const COLORS = [
  "#8c6d31",
  "#555555",
  "#e08e2b",
  "#2b7bba",
  "#9b59b6",
  "#f2c200",
  "#4caf7a",
];

d3.csv("data/data.csv", d3.autoType)
  .then((data) => {
    const [monthCol, ...keys] = data.columns;
    const months = data.map((d) => d[monthCol]);
    const series = d3.stack().keys(keys)(data);

    const x = d3.scaleBand(months, [M.left, W - M.right]).padding(0.15);
    const y = d3.scaleLinear([0, 100], [H - M.bottom, M.top]);
    const color = d3.scaleOrdinal(keys, COLORS);

    const svg = d3.select("#chart").append("svg").attr("viewBox", [0, 0, W, H]);

    // Una capa per font; cada barra va de y0 a y1
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (s) => color(s.key))
      .selectAll("rect")
      .data((s) =>
        s.map((d) => ({
          key: s.key,
          month: d.data[monthCol],
          y0: d[0],
          y1: d[1],
        })),
      )
      .join("rect")
      .attr("x", (d) => x(d.month))
      .attr("y", (d) => y(d.y1))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(d.y0) - y(d.y1))
      .append("title")
      .text((d) => `${d.month} · ${d.key}: ${(d.y1 - d.y0).toFixed(1)} %`);

    // Eix X (una etiqueta cada 3 mesos, girada) i eix Y en %
    svg
      .append("g")
      .attr("transform", `translate(0,${H - M.bottom})`)
      .call(d3.axisBottom(x).tickValues(months.filter((_, i) => i % 3 === 0)))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    svg
      .append("g")
      .attr("transform", `translate(${M.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => d + " %"),
      );

    // Llegenda, en ordre invers perquè coincideixi amb l'ordre de l'apilat
    svg
      .append("g")
      .attr("transform", `translate(${W - M.right + 15},${M.top})`)
      .attr("font-size", 12)
      .attr("fill", "currentColor")
      .selectAll("g")
      .data([...keys].reverse())
      .join("g")
      .attr("transform", (_, i) => `translate(0,${i * 22})`)
      .call((g) =>
        g
          .append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color),
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", 18)
          .attr("y", 10)
          .text((k) => k),
      );
  })
  .catch((err) => {
    document
      .getElementById("chart")
      .insertAdjacentHTML(
        "beforeend",
        `<p style="color:red">No s'han pogut carregar les dades: ${err.message}</p>`,
      );
  });
