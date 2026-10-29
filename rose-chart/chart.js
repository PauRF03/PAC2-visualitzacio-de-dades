const SIZE = 720,
  INNER = 36,
  OUTER = 270,
  LABEL = 298;
const MAX = 18;
const DEFAULT_YEAR = 2024;

const dec = new Intl.NumberFormat("ca", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat("ca", { maximumFractionDigits: 0 });

const chart = d3.select("#chart");
if (d3.select("#year").empty()) {
  chart.insert("label", "*").attr("for", "year").text("Any: ");
  chart.insert("select", "svg").attr("id", "year");
}
if (d3.select("#insight").empty()) chart.append("p").attr("id", "insight");

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("viewBox", [-SIZE / 2, -SIZE / 2, SIZE, SIZE]);

function parse(d) {
  const label = Object.values(d)[0];
  const [mon, yy] = label.split(" '");
  return {
    year: 2000 + +yy,
    label: mon,
    t: d.Tourists / 1000,
    e: d.Excursionists / 1000,
  };
}

function draw(rows, year) {
  svg.selectAll("*").remove();
  const data = rows.filter((d) => d.year === year).map((d, m) => ({ ...d, m }));

  const x = d3.scaleBand(d3.range(12), [0, 2 * Math.PI]);
  const y = d3.scaleRadial([0, MAX], [INNER, OUTER]);
  const at = (m, r) => {
    const a = x(m) + x.bandwidth() / 2;
    return `translate(${Math.sin(a) * r},${-Math.cos(a) * r})`;
  };

  const ticks = [5, 10, 15];
  svg
    .append("g")
    .attr("fill", "none")
    .style("stroke", "var(--grid, #d9dee4)")
    .selectAll("circle")
    .data(ticks)
    .join("circle")
    .attr("r", y);
  svg
    .append("g")
    .attr("font-size", 11)
    .attr("text-anchor", "middle")
    .style("fill", "var(--muted, #5f6c7b)")
    .selectAll("text")
    .data(ticks)
    .join("text")
    .attr("y", (d) => -y(d) - 3)
    .text((d) => `${d} M`);

  const arc = d3
    .arc()
    .innerRadius((s) => y(s.from))
    .outerRadius((s) => y(s.to))
    .startAngle((s) => x(s.d.m))
    .endAngle((s) => x(s.d.m) + x.bandwidth())
    .padAngle(0.012)
    .padRadius(INNER);
  const segments = data.flatMap((d) => [
    { d, name: "Tourists", from: 0, to: d.t, fill: "var(--tourists, #b23a1f)" },
    {
      d,
      name: "Excursionists",
      from: d.t,
      to: d.t + d.e,
      fill: "var(--excursionists, #f0b27a)",
    },
  ]);
  svg
    .append("g")
    .selectAll("path")
    .data(segments)
    .join("path")
    .attr("d", arc)
    .style("fill", (s) => s.fill)
    .append("title")
    .text(
      (s) =>
        `${s.d.label} '${String(year).slice(2)} · ${s.name}: ${dec.format(s.to - s.from)} milions`,
    );

  const labels = (pos, text, weight) =>
    svg
      .append("g")
      .attr("font-size", 13)
      .attr("font-weight", weight)
      .attr("text-anchor", "middle")
      .style("fill", "var(--text, #1f2933)")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("transform", pos)
      .attr("dy", "0.32em")
      .text(text);
  labels(
    (d) => at(d.m, y(d.t + d.e) + 11),
    (d) => dec.format(d.t + d.e),
    600,
  );
  labels(
    (d) => at(d.m, LABEL),
    (d) => d.label,
    400,
  );
}

d3.csv("data/data.csv")
  .then((raw) => {
    const rows = raw.map(parse);
    const years = [...new Set(rows.map((d) => d.year))];

    d3.select("#year")
      .selectAll("option")
      .data(years)
      .join("option")
      .attr("value", (d) => d)
      .property("selected", (d) => d === DEFAULT_YEAR)
      .text((d) => d);
    d3.select("#year").on("change", (event) => draw(rows, +event.target.value));

    draw(rows, DEFAULT_YEAR);
  })
  .catch((err) => {
    document
      .getElementById("chart")
      .insertAdjacentHTML(
        "beforeend",
        `<p style="color:#c00">No s'han pogut carregar les dades: ${err.message}. ` +
          `Obre la pàgina amb un servidor local (per exemple, Live Server de VS Code).</p>`,
      );
  });
